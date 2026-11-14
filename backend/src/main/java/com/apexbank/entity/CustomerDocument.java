package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomerDocument extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // PAN, AADHAAR, PASSPORT, SALARY_SLIP, UTILITY_BILL

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "document_url", length = 255)
    private String documentUrl;

    @Column(name = "verification_status", length = 30)
    @Builder.Default
    private String verificationStatus = "VERIFIED";

    @Column(name = "remarks", length = 255)
    private String remarks;
}
