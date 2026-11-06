package br.com.luizmoura.alugamais.auth;

import br.com.luizmoura.alugamais.database.Db;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class AuthServiceTest {
    private final AuthService service = new AuthService(mock(Db.class), mock(PasswordEncoder.class));

    @Test
    void cadastroNaoAceitaSenhaCurta() {
        var input = new AuthService.Registration("aluno1", "123", "CLIENT",
                "Aluno Teste", "12345678901", "MG1", "Belo Horizonte", "Estudante",
                null, null, null);
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.register(input)).getStatusCode().value());
    }

    @Test
    void loginExigeSenha() {
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.login(new AuthService.Credentials("aluno1", null))).getStatusCode().value());
    }

    @Test
    void hashDeTokenNaoRevelaValorOriginal() {
        String token = "ab12";
        assertEquals(64, AuthService.digest(token).length());
        assertNotEquals(token, AuthService.digest(token));
    }
}
