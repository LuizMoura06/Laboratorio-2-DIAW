package br.com.luizmoura.alugamais.rentals;

import br.com.luizmoura.alugamais.clients.ClientService;
import br.com.luizmoura.alugamais.database.Db;
import br.com.luizmoura.alugamais.security.CurrentUser;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class RentalService {
    private final Db db;
    private final ClientService clients;

    public RentalService(Db db, ClientService clients) { this.db = db; this.clients = clients; }

    public record RentalInput(UUID vehicleId, LocalDate startDate, LocalDate endDate, String notes) { }
    public record ReviewInput(String status, String reviewNotes) { }
    public record ContractInput(boolean credit, UUID bankAgentId, BigDecimal principal, Integer installments) { }

    private static final String RENTAL_SELECT = "SELECT r.id,r.client_id AS \"clientId\",c.full_name AS \"clientName\", "
            + "r.vehicle_id AS \"vehicleId\",v.brand,v.model,v.plate,v.daily_rate AS \"dailyRate\", "
            + "to_char(r.start_date,'YYYY-MM-DD') AS \"startDate\",to_char(r.end_date,'YYYY-MM-DD') AS \"endDate\", "
            + "r.notes,r.review_notes AS \"reviewNotes\",r.status,a.name AS \"agentName\", "
            + "to_char(r.created_at,'DD/MM/YYYY HH24:MI') AS \"createdAt\" "
            + "FROM rental_requests r JOIN clients c ON c.id=r.client_id JOIN vehicles v ON v.id=r.vehicle_id "
            + "LEFT JOIN agents a ON a.id=r.agent_id ";

    public List<Map<String, Object>> list(CurrentUser user) {
        if (user.role().equals("AGENT"))
            return db.list(RENTAL_SELECT + "ORDER BY r.created_at DESC");
        return db.list(RENTAL_SELECT + "WHERE c.user_id=? ORDER BY r.created_at DESC", user.id());
    }

    public Map<String, Object> byId(CurrentUser user, UUID id) {
        var rental = db.require(RENTAL_SELECT + "WHERE r.id=?", id);
        if (user.role().equals("CLIENT") && !rental.get("clientId").equals(clients.ownClientId(user)))
            throw new ResponseStatusException(FORBIDDEN, "Você não pode acessar pedidos de outros clientes");
        return rental;
    }

    @Transactional
    public Map<String, Object> create(CurrentUser user, RentalInput input) {
        user.requireRole("CLIENT");
        validateInput(input);
        lockVehicle(input.vehicleId());
        ensureAvailable(input.vehicleId(), input.startDate(), input.endDate(), null);
        var id = UUID.randomUUID();
        db.run("INSERT INTO rental_requests(id,client_id,vehicle_id,start_date,end_date,notes,status) VALUES(?,?,?,?,?,?,'PENDING')",
                id, clients.ownClientId(user), input.vehicleId(), Date.valueOf(input.startDate()),
                Date.valueOf(input.endDate()), input.notes());
        return byId(user, id);
    }

    @Transactional
    public Map<String, Object> edit(CurrentUser user, UUID id, RentalInput input) {
        validateInput(input);
        lockRental(id);
        var previous = byId(user, id);
        var status = (String) previous.get("status");
        if (user.role().equals("CLIENT") && !status.equals("PENDING"))
            throw new ResponseStatusException(CONFLICT, "O cliente só pode alterar pedidos pendentes");
        if (status.equals("CANCELLED") || status.equals("CONTRACTED") || status.equals("REJECTED"))
            throw new ResponseStatusException(CONFLICT, "Pedido finalizado não pode ser alterado");
        lockVehicle(input.vehicleId());
        ensureAvailable(input.vehicleId(), input.startDate(), input.endDate(), id);
        db.run("UPDATE rental_requests SET vehicle_id=?,start_date=?,end_date=?,notes=? WHERE id=?",
                input.vehicleId(), Date.valueOf(input.startDate()), Date.valueOf(input.endDate()), input.notes(), id);
        return byId(user, id);
    }

    @Transactional
    public Map<String, Object> cancel(CurrentUser user, UUID id) {
        user.requireRole("CLIENT");
        lockRental(id);
        var rental = byId(user, id);
        if (!List.of("PENDING", "UNDER_REVIEW", "APPROVED").contains(rental.get("status")))
            throw new ResponseStatusException(CONFLICT, "Este pedido não pode mais ser cancelado");
        db.run("UPDATE rental_requests SET status='CANCELLED' WHERE id=?", id);
        return byId(user, id);
    }

    @Transactional
    public Map<String, Object> review(CurrentUser user, UUID id, ReviewInput input) {
        user.requireRole("AGENT");
        if (input == null || !List.of("UNDER_REVIEW", "APPROVED", "REJECTED").contains(input.status())
                || input.reviewNotes() == null || input.reviewNotes().isBlank()
                || input.reviewNotes().length() > 500)
            throw new ResponseStatusException(BAD_REQUEST, "Parecer inválido");
        lockRental(id);
        var rental = byId(user, id);
        if (!List.of("PENDING", "UNDER_REVIEW").contains(rental.get("status")))
            throw new ResponseStatusException(CONFLICT, "Este pedido não pode ser avaliado novamente");
        var agentId = db.require("SELECT id FROM agents WHERE user_id=?", user.id()).get("id");
        db.run("UPDATE rental_requests SET status=?,review_notes=?,agent_id=?,reviewed_at=NOW() WHERE id=?",
                input.status(), input.reviewNotes(), agentId, id);
        return byId(user, id);
    }

    @Transactional
    public Map<String, Object> contract(CurrentUser user, UUID id, ContractInput input) {
        user.requireRole("AGENT");
        lockRental(id);
        var rental = byId(user, id);
        if (!"APPROVED".equals(rental.get("status")))
            throw new ResponseStatusException(CONFLICT, "O contrato exige parecer financeiro positivo");
        var contractId = UUID.randomUUID();
        db.run("INSERT INTO rental_contracts(id,rental_id) VALUES(?,?)", contractId, id);
        if (input != null && input.credit()) {
            if (input.bankAgentId() == null || input.principal() == null || input.principal().signum() <= 0
                    || input.installments() == null || input.installments() < 1 || input.installments() > 120)
                throw new ResponseStatusException(BAD_REQUEST, "Informe banco, crédito positivo e número de parcelas (1 a 120)");
            var bank = db.require("SELECT agent_type FROM agents WHERE id=?", input.bankAgentId());
            if (!"BANK".equals(bank.get("agent_type")))
                throw new ResponseStatusException(BAD_REQUEST, "O crédito só pode ser concedido por um banco agente");
            db.run("INSERT INTO credit_agreements(id,contract_id,bank_agent_id,principal,installments) VALUES(?,?,?,?,?)",
                    UUID.randomUUID(), contractId, input.bankAgentId(), input.principal(), input.installments());
        }
        db.run("UPDATE rental_requests SET status='CONTRACTED' WHERE id=?", id);
        return byId(user, id);
    }

    public List<Map<String, Object>> contracts(CurrentUser user) {
        var sql = "SELECT k.id,k.rental_id AS \"rentalId\",c.full_name AS \"clientName\",v.model, "
                + "to_char(k.signed_at,'DD/MM/YYYY HH24:MI') AS \"signedAt\", "
                + "cr.principal,cr.installments,a.name AS \"bankName\" "
                + "FROM rental_contracts k JOIN rental_requests r ON r.id=k.rental_id "
                + "JOIN clients c ON c.id=r.client_id JOIN vehicles v ON v.id=r.vehicle_id "
                + "LEFT JOIN credit_agreements cr ON cr.contract_id=k.id "
                + "LEFT JOIN agents a ON a.id=cr.bank_agent_id ";
        if (user.role().equals("AGENT")) return db.list(sql + "ORDER BY k.signed_at DESC");
        return db.list(sql + "WHERE c.user_id=? ORDER BY k.signed_at DESC", user.id());
    }

    public List<Map<String, Object>> bankAgents() {
        return db.list("SELECT id,name,cnpj FROM agents WHERE agent_type='BANK' ORDER BY name");
    }

    private void lockVehicle(UUID id) {
        db.require("SELECT id FROM vehicles WHERE id=? FOR UPDATE", id);
    }

    private void lockRental(UUID id) {
        db.require("SELECT id FROM rental_requests WHERE id=? FOR UPDATE", id);
    }

    private void ensureAvailable(UUID vehicleId, LocalDate start, LocalDate end, UUID except) {
        var sql = "SELECT id FROM rental_requests WHERE vehicle_id=? "
                + "AND status IN ('PENDING','UNDER_REVIEW','APPROVED','CONTRACTED') "
                + "AND start_date < ? AND end_date > ?";
        var collisions = except == null
                ? db.list(sql + " LIMIT 1", vehicleId, Date.valueOf(end), Date.valueOf(start))
                : db.list(sql + " AND id <> ? LIMIT 1", vehicleId, Date.valueOf(end), Date.valueOf(start), except);
        if (!collisions.isEmpty()) throw new ResponseStatusException(CONFLICT, "Veículo indisponível para o período escolhido");
    }

    private static void validateInput(RentalInput input) {
        if (input == null || input.vehicleId() == null || input.startDate() == null || input.endDate() == null
                || input.startDate().isBefore(LocalDate.now(ZoneId.of("America/Sao_Paulo"))) || !input.endDate().isAfter(input.startDate())
                || (input.notes() != null && input.notes().length() > 500))
            throw new ResponseStatusException(BAD_REQUEST, "Informe veículo e período válido (retirada a partir de hoje)");
    }
}

