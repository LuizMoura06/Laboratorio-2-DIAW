package br.com.luizmoura.alugamais.rentals;

import br.com.luizmoura.alugamais.clients.ClientService;
import br.com.luizmoura.alugamais.database.Db;
import br.com.luizmoura.alugamais.security.CurrentUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RentalServiceTest {
    private Db db;
    private RentalService service;
    private CurrentUser client;
    private CurrentUser agent;

    @BeforeEach
    void prepare() {
        db = mock(Db.class);
        service = new RentalService(db, mock(ClientService.class));
        client = new CurrentUser(UUID.randomUUID(), "cliente", "CLIENT");
        agent = new CurrentUser(UUID.randomUUID(), "agente", "AGENT");
    }

    @Test
    void apenasClientesPodemCriarPedidos() {
        var input = new RentalService.RentalInput(UUID.randomUUID(), LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(5), "Viagem");
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.create(agent, input)).getStatusCode().value());
        verify(db, never()).run(anyString(), any(Object[].class));
    }

    @Test
    void pedidoExigeDataFinalMaiorQueInicial() {
        var date = LocalDate.now().plusDays(3);
        var input = new RentalService.RentalInput(UUID.randomUUID(), date, date, null);
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.create(client, input)).getStatusCode().value());
    }

    @Test
    void pedidoNaoAceitaDataPassada() {
        var date = LocalDate.now().minusDays(5);
        var input = new RentalService.RentalInput(UUID.randomUUID(), date, date.plusDays(2), null);
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.create(client, input)).getStatusCode().value());
    }

    @Test
    void avaliacaoFinanceiraExigeAgente() {
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.review(client, UUID.randomUUID(),
                        new RentalService.ReviewInput("APPROVED", "Analisado"))).getStatusCode().value());
    }

    @Test
    void pedidoContratadoNaoPodeSerAprovadoNovamente() {
        UUID rentalId = UUID.randomUUID();
        when(db.require(anyString(), any())).thenReturn(Map.of("status", "CONTRACTED"));
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.review(agent, rentalId,
                        new RentalService.ReviewInput("APPROVED", "Nova análise"))).getStatusCode().value());
    }

    @Test
    void contratoDependeDeParecerPositivo() {
        UUID rentalId = UUID.randomUUID();
        when(db.require(anyString(), any())).thenReturn(Map.of("status", "PENDING"));
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.contract(agent, rentalId, null)).getStatusCode().value());
    }

    @Test
    void somenteAgentePodeConsultarTodasAsSolicitacoes() {
        when(db.list(anyString())).thenReturn(List.of());
        assertEquals(0, service.list(agent).size());
    }
}
