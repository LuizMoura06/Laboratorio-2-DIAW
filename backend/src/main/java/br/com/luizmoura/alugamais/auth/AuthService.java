package br.com.luizmoura.alugamais.auth;

import br.com.luizmoura.alugamais.database.Db;
import br.com.luizmoura.alugamais.security.CurrentUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {
    private final Db db;
    private final PasswordEncoder encoder;

    public AuthService(Db db, PasswordEncoder encoder) { this.db = db; this.encoder = encoder; }

    public record Registration(String username, String password, String role, String fullName,
            String cpf, String rg, String address, String profession,
            String agentName, String agentType, String cnpj) { }
    public record Credentials(String username, String password) { }
    public record AuthResult(String token, String username, String role, String name) { }

    @Transactional
    public AuthResult register(Registration input) {
        if (input == null) throw new ResponseStatusException(BAD_REQUEST, "Preencha o cadastro");
        var username = input.username() == null ? "" : input.username().trim().toLowerCase(Locale.ROOT);
        var password = input.password() == null ? "" : input.password();
        var role = input.role() == null ? "" : input.role().toUpperCase(Locale.ROOT);
        if (!username.matches("[a-z0-9._-]{3,60}") || password.length() < 8 || password.length() > 72
                || (!role.equals("CLIENT") && !role.equals("AGENT")))
            throw new ResponseStatusException(BAD_REQUEST, "Usuário, senha ou perfil inválido (senha: 8 a 72 caracteres)");
        if (db.one("SELECT id FROM app_users WHERE username = ?", username) != null)
            throw new ResponseStatusException(CONFLICT, "Esse nome de usuário já existe");

        var userId = UUID.randomUUID();
        try {
            db.run("INSERT INTO app_users(id,username,password_hash,role) VALUES(?,?,?,?)",
                    userId, username, encoder.encode(password), role);
            if (role.equals("CLIENT")) {
                if (blank(input.fullName()) || blank(input.rg()) || blank(input.address()) || blank(input.profession())
                        || input.cpf() == null || !input.cpf().matches("\\d{11}"))
                    throw new ResponseStatusException(BAD_REQUEST, "Informe nome, CPF de 11 dígitos, RG, endereço e profissão");
                db.run("INSERT INTO clients(id,user_id,full_name,cpf,rg,address,profession) VALUES(?,?,?,?,?,?,?)",
                        UUID.randomUUID(), userId, input.fullName().trim(), input.cpf(), input.rg().trim(),
                        input.address().trim(), input.profession().trim());
            } else {
                var agentType = input.agentType() == null ? "" : input.agentType().toUpperCase(Locale.ROOT);
                if (blank(input.agentName()) || input.cnpj() == null || !input.cnpj().matches("\\d{14}")
                        || (!agentType.equals("BANK") && !agentType.equals("COMPANY")))
                    throw new ResponseStatusException(BAD_REQUEST, "Informe empresa/banco, CNPJ de 14 dígitos e tipo do agente");
                db.run("INSERT INTO agents(id,user_id,name,agent_type,cnpj) VALUES(?,?,?,?,?)",
                        UUID.randomUUID(), userId, input.agentName().trim(), agentType, input.cnpj());
            }
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(CONFLICT, "Usuário, CPF ou CNPJ já cadastrado");
        }
        return newSession(userId, username, role);
    }

    public AuthResult login(Credentials input) {
        if (input == null || blank(input.username()) || input.password() == null)
            throw new ResponseStatusException(BAD_REQUEST, "Informe usuário e senha");
        var row = db.one("SELECT id,username,role,password_hash FROM app_users WHERE username = ?",
                input.username().trim().toLowerCase(Locale.ROOT));
        if (row == null || !encoder.matches(input.password(), (String) row.get("password_hash")))
            throw new ResponseStatusException(UNAUTHORIZED, "Usuário ou senha incorretos");
        return newSession((UUID) row.get("id"), (String) row.get("username"), (String) row.get("role"));
    }

    public CurrentUser authenticate(String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer ")) return null;
        var token = bearer.substring(7).trim();
        if (token.length() != 64 || !token.matches("[a-fA-F0-9]+")) return null;
        var row = db.one("SELECT u.id,u.username,u.role FROM session_tokens s JOIN app_users u ON u.id=s.user_id "
                        + "WHERE s.token_hash=? AND s.expires_at > NOW()", digest(token));
        return row == null ? null : new CurrentUser((UUID) row.get("id"),
                (String) row.get("username"), (String) row.get("role"));
    }

    public void logout(String bearer) {
        if (bearer != null && bearer.startsWith("Bearer "))
            db.run("DELETE FROM session_tokens WHERE token_hash=?", digest(bearer.substring(7).trim()));
    }

    private AuthResult newSession(UUID userId, String username, String role) {
        var token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        db.run("INSERT INTO session_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)",
                digest(token), userId, Timestamp.from(Instant.now().plus(12, ChronoUnit.HOURS)));
        var profile = db.require(role.equals("CLIENT")
                ? "SELECT full_name AS name FROM clients WHERE user_id=?"
                : "SELECT name FROM agents WHERE user_id=?", userId);
        return new AuthResult(token, username, role, (String) profile.get("name"));
    }

    public static String digest(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }
}

