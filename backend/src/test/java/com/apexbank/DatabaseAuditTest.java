package com.apexbank;

import org.junit.jupiter.api.Test;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DatabaseAuditTest {

    @Test
    public void auditDatabaseTables() {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        String user = System.getenv("SPRING_DATASOURCE_USERNAME");
        String pass = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (url == null) {
            url = "jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/enterprise_bank_db?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3";
            user = "HVtbf3tQkyxXK4C.root";
            pass = "LACrrRIQSQxK1tDU";
        }

        System.out.println("=== AUDITING DATABASE: enterprise_bank_db ===");

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            List<String> tables = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SHOW TABLES FROM enterprise_bank_db")) {
                while (rs.next()) {
                    tables.add(rs.getString(1));
                }
            }

            System.out.println("\n--- TOTAL TABLES IN enterprise_bank_db: " + tables.size() + " ---");
            for (String table : tables) {
                try (Statement stmt = conn.createStatement();
                     ResultSet countRs = stmt.executeQuery("SELECT COUNT(*) FROM `enterprise_bank_db`.`" + table + "`")) {
                    countRs.next();
                    long count = countRs.getLong(1);
                    System.out.printf("Table: %-30s | Rows: %d%n", table, count);
                } catch (Exception e) {
                    System.out.printf("Table: %-30s | Error: %s%n", table, e.getMessage());
                }
            }

            System.out.println("\n--- FOREIGN KEYS IN enterprise_bank_db ---");
            try (Statement stmt = conn.createStatement();
                 ResultSet fkRs = stmt.executeQuery(
                         "SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME " +
                         "FROM information_schema.KEY_COLUMN_USAGE " +
                         "WHERE TABLE_SCHEMA = 'enterprise_bank_db' AND REFERENCED_TABLE_NAME IS NOT NULL")) {
                while (fkRs.next()) {
                    System.out.printf("FK: %s.%s -> %s.%s%n",
                            fkRs.getString("TABLE_NAME"),
                            fkRs.getString("COLUMN_NAME"),
                            fkRs.getString("REFERENCED_TABLE_NAME"),
                            fkRs.getString("REFERENCED_COLUMN_NAME"));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
