package com.apexbank.util;

public final class PiiMaskingUtil {

    private PiiMaskingUtil() {
        // Private constructor for utility class
    }

    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        int len = accountNumber.length();
        String lastFour = accountNumber.substring(len - 4);
        return "ACC-****-" + lastFour;
    }

    public static String maskPan(String pan) {
        if (pan == null || pan.length() < 10) {
            return "**********";
        }
        // First 3 chars, 4 asterisks, last 3 chars (e.g. ABC****12D)
        return pan.substring(0, 3) + "****" + pan.substring(7);
    }

    public static String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.length() < 4) {
            return "************";
        }
        String clean = aadhaar.replaceAll("\\s|-", "");
        if (clean.length() >= 4) {
            String lastFour = clean.substring(clean.length() - 4);
            return "XXXX-XXXX-" + lastFour;
        }
        return "XXXX-XXXX-XXXX";
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "*****@bank.com";
        }
        int atIndex = email.indexOf('@');
        String name = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (name.length() <= 2) {
            return name.charAt(0) + "***" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "******";
        }
        String clean = phone.replaceAll("\\s|\\+|-", "");
        if (clean.length() >= 4) {
            return "******" + clean.substring(clean.length() - 4);
        }
        return "******";
    }
}
