package com.example.AviaryService.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "flight_logs")
public class FlightLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String fromAirport;

    @Column(nullable = true)
    private String toAirport;

    @Column(nullable = true)
    private Double hobbsIn;  // Use Double for decimal hours if needed

    @Column(nullable = true)
    private Double hobbsOut;

    @Column(nullable = true)
    private Double tachIn;

    @Column(nullable = true)
    private Double tachOut;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    // Constructors
    public FlightLog() {}

    public FlightLog(String fromAirport, String toAirport, Double hobbsIn, Double hobbsOut, Double tachIn, Double tachOut, User user) {
        this.fromAirport = fromAirport;
        this.toAirport = toAirport;
        this.hobbsIn = hobbsIn;
        this.hobbsOut = hobbsOut;
        this.tachIn = tachIn;
        this.tachOut = tachOut;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFromAirport() { return fromAirport; }
    public void setFromAirport(String fromAirport) { this.fromAirport = fromAirport; }
    public String getToAirport() { return toAirport; }
    public void setToAirport(String toAirport) { this.toAirport = toAirport; }
    public Double getHobbsIn() { return hobbsIn; }
    public void setHobbsIn(Double hobbsIn) { this.hobbsIn = hobbsIn; }
    public Double getHobbsOut() { return hobbsOut; }
    public void setHobbsOut(Double hobbsOut) { this.hobbsOut = hobbsOut; }
    public Double getTachIn() { return tachIn; }
    public void setTachIn(Double tachIn) { this.tachIn = tachIn; }
    public Double getTachOut() { return tachOut; }
    public void setTachOut(Double tachOut) { this.tachOut = tachOut; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}