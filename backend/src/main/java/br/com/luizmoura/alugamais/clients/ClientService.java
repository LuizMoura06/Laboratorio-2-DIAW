package br.com.luizmoura.alugamais.clients;

import br.com.luizmoura.alugamais.database.Db;
import br.com.luizmoura.alugamais.security.CurrentUser;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
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
public class ClientService {
    private final Db db;

    public ClientService(Db db) { this.db = db; }

    public record ClientInput(String fullName, String cpf, String rg, String address, String profession) { }
    public record EmploymentInput(String employer, BigDecimal monthlyIncome) { }

    public Map<String, Object> mine(CurrentUser user) {
        user.requireRole("CLIENT");
        return details(db.require("SELECT id FROM clients WHERE user_id=?", user.id()).get("id"));
    }

    public List<Map<String, Object>> all(CurrentUser user) {
        user.requireRole("AGENT");
        return db.list("SELECT id,full_name AS \"fullName\",cpf,rg,address,profession FROM clients ORDER BY full_name");
    }

    public Map<String, Object> detailForAgent(CurrentUser user, UUID id) {
        user.requireRole("AGENT");
        return details(id);
    }

    public Map<String, Object> details(Object id) {
        var client = db.require("SELECT id,full_name AS \"fullName\",cpf,rg,address,profession FROM clients WHERE id=?", id);
        var result = new LinkedHashMap<>(client);
        result.put("employments", db.list("SELECT id,employer,monthly_income AS \"monthlyIncome\",position "
                + "FROM employments WHERE client_id=? ORDER BY position", id));
        return result;
    }

    public Map<String, Object> update(CurrentUser user, ClientInput input) {
        user.requireRole("CLIENT");
        if (input == null || blank(input.fullName()) || blank(input.rg()) || blank(input.address())
                || blank(input.profession()) || input.cpf() == null || !input.cpf().matches("\\d{11}"))
            throw new ResponseStatusException(BAD_REQUEST, "Preencha todos os dados do cliente (CPF: 11 dígitos)");
        var id = ownClientId(user);
        db.run("UPDATE clients SET full_name=?,cpf=?,rg=?,address=?,profession=? WHERE id=?",
                input.fullName().trim(), input.cpf(), input.rg().trim(), input.address().trim(),
                input.profession().trim(), id);
        return details(id);
    }

    @Transactional
    public void delete(CurrentUser user) {
        user.requireRole("CLIENT");
        var id = ownClientId(user);
        var orders = db.list("SELECT id FROM rental_requests WHERE client_id=? LIMIT 1", id);
        if (!orders.isEmpty()) throw new ResponseStatusException(CONFLICT,
                "Este cliente possui histórico de aluguéis e não pode ser excluído");
        db.run("DELETE FROM app_users WHERE id=?", user.id());
    }

    @Transactional
    public Map<String, Object> addEmployment(CurrentUser user, EmploymentInput input) {
        user.requireRole("CLIENT");
        checkEmployment(input);
        var id = ownClientId(user);
        var current = db.list("SELECT position FROM employments WHERE client_id=? ORDER BY position", id);
        if (current.size() >= 3) throw new ResponseStatusException(BAD_REQUEST, "Máximo de 3 empregadores por cliente");
        int position = 1;
        while (containsPosition(current, position)) position++;
        db.run("INSERT INTO employments(id,client_id,employer,monthly_income,position) VALUES(?,?,?,?,?)",
                UUID.randomUUID(), id, input.employer().trim(), input.monthlyIncome(), position);
        return details(id);
    }

    public Map<String, Object> updateEmployment(CurrentUser user, UUID employmentId, EmploymentInput input) {
        user.requireRole("CLIENT");
        checkEmployment(input);
        int updated = db.run("UPDATE employments SET employer=?,monthly_income=? WHERE id=? AND client_id=?",
                input.employer().trim(), input.monthlyIncome(), employmentId, ownClientId(user));
        if (updated == 0) throw new ResponseStatusException(FORBIDDEN, "Empregador não pertence ao cliente");
        return mine(user);
    }

    public Map<String, Object> deleteEmployment(CurrentUser user, UUID employmentId) {
        user.requireRole("CLIENT");
        int updated = db.run("DELETE FROM employments WHERE id=? AND client_id=?", employmentId, ownClientId(user));
        if (updated == 0) throw new ResponseStatusException(FORBIDDEN, "Empregador não pertence ao cliente");
        return mine(user);
    }

    public UUID ownClientId(CurrentUser user) {
        user.requireRole("CLIENT");
        return (UUID) db.require("SELECT id FROM clients WHERE user_id=?", user.id()).get("id");
    }

    private static boolean containsPosition(List<Map<String, Object>> rows, int position) {
        return rows.stream().anyMatch(r -> ((Number) r.get("position")).intValue() == position);
    }

    private static void checkEmployment(EmploymentInput input) {
        if (input == null || blank(input.employer()) || input.monthlyIncome() == null
                || input.monthlyIncome().signum() < 0)
            throw new ResponseStatusException(BAD_REQUEST, "Informe empregador e renda válida");
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }
}

