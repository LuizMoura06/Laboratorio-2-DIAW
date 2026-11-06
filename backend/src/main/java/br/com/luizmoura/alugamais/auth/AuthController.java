package br.com.luizmoura.alugamais.auth;

import br.com.luizmoura.alugamais.security.CurrentUser;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AuthResult register(@RequestBody AuthService.Registration input) {
        return service.register(input);
    }

    @PostMapping("/login")
    public AuthService.AuthResult login(@RequestBody AuthService.Credentials input) {
        return service.login(input);
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        var user = CurrentUser.get();
        return Map.of("id", user.id().toString(), "username", user.username(), "role", user.role());
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader(value = "Authorization", required = false) String bearer) {
        service.logout(bearer);
    }
}

