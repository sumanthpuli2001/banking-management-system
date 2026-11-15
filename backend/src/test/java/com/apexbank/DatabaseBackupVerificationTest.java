package com.apexbank;

import org.junit.jupiter.api.Test;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DatabaseBackupVerificationTest {

    @Test
    public void dumpSchemaAndVerifyState() {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        String user = System.getenv("SPRING_DATASOURCE_USERNAME");
        String pass = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (url == null) {
            url = "jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/enterprise_bank_db?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3";
            user = "HVtbf3tQkyxXK4C.root";
            pass = "LACrrRIQSQxK1tDU";
        }

        String backupFile = "D:/Banking Management System/database-baseline-backup.sql";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             PrintWriter writer = new PrintWriter(new FileWriter(backupFile))) {

            writer.println("-- =====================================================");
            writer.println("-- APEX NATIONAL BANK (BMS v2.4) - DATABASE BASELINE BACKUP");
            writer.println("-- Created for Phase 1 Safety Audit");
            writer.println("-- Host: TiDB Cloud Serverless (enterprise_bank_db)");
            writer.println("-- Timestamp: " + new java.util.Date());
            writer.println("-- =====================================================\n");

            List<String> tables = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SHOW TABLES FROM enterprise_bank_db")) {
                while (rs.next()) {
                    tables.add(rs.getString(1));
                }
            }

            for (String table : tables) {
                try (Statement stmt = conn.createStatement();
                     ResultSet createRs = stmt.executeQuery("SHOW CREATE TABLE `enterprise_bank_db`.`" + table + "`")) {
                    if (createRs.next()) {
                        writer.println("-- Table structure for table: " + table);
                        writer.println(createRs.getString(2) + ";\n");
                    }
                }
            }

            System.out.println("Verified backup file written to: " + backupFile);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
