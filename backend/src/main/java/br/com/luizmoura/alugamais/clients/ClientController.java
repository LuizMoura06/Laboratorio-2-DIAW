package br.com.luizmoura.alugamais.clients;

import br.com.luizmoura.alugamais.security.CurrentUser;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    private final ClientService service;

    public ClientController(ClientService service) { this.service = service; }

    @GetMapping("/me")
    public Map<String, Object> mine() { return service.mine(CurrentUser.get()); }

    @PutMapping("/me")
    public Map<String, Object> update(@RequestBody ClientService.ClientInput input) {
        return service.update(CurrentUser.get(), input);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete() { service.delete(CurrentUser.get()); }

    @GetMapping
    public List<Map<String, Object>> all() { return service.all(CurrentUser.get()); }

    @GetMapping("/{id}")
    public Map<String, Object> byId(@PathVariable UUID id) {
        return service.detailForAgent(CurrentUser.get(), id);
    }

    @PostMapping("/me/employments")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addEmployment(@RequestBody ClientService.EmploymentInput input) {
        return service.addEmployment(CurrentUser.get(), input);
    }

    @PutMapping("/me/employments/{id}")
    public Map<String, Object> editEmployment(@PathVariable UUID id,
                                               @RequestBody ClientService.EmploymentInput input) {
        return service.updateEmployment(CurrentUser.get(), id, input);
    }

    @DeleteMapping("/me/employments/{id}")
    public Map<String, Object> removeEmployment(@PathVariable UUID id) {
        return service.deleteEmployment(CurrentUser.get(), id);
    }
}

