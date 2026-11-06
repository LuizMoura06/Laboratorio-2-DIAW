package br.com.luizmoura.alugamais.database;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Repository
public class Db {
    private final JdbcTemplate jdbc;

    public Db(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Map<String, Object>> list(String sql, Object... args) {
        return jdbc.queryForList(sql, args);
    }

    public Map<String, Object> one(String sql, Object... args) {
        var rows = list(sql, args);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> require(String sql, Object... args) {
        var row = one(sql, args);
        if (row == null) throw new ResponseStatusException(NOT_FOUND, "Registro não encontrado");
        return row;
    }

    public int run(String sql, Object... args) { return jdbc.update(sql, args); }
}

