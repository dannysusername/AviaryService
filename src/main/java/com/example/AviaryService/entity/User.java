package com.example.AviaryService.entity;

import jakarta.persistence.*;
import java.util.List;

import com.example.AviaryService.config.AeroApiKeyConverter;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long Id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<ServiceTimeline> serviceTimeline;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<FlightLog> flightLogs;

    @Column
    private Double blockTimeHours;

    @Column
    private Double timeInServiceHours;

    @Column
    private String makeModel;

    @Column
    private String tailNumber;

    @Column
    private String ownerName;

    @Column
    private String makeModelSN;

    @Column
    private java.time.Instant blockTimeUpdatedAt;

    @Column
    private java.time.Instant timeInServiceUpdatedAt;

    @Column
    private String blockTimeUpdatedSource;

    @Column
    private String timeInServiceUpdatedSource;

    // Manual "floor" for the airframe meter. Any manual edit on /updateHours
    // writes this column too; log-book activity can only raise the displayed
    // value above this floor, never below it. See computeDisplayedHours().
    @Column
    private Double blockTimeManualBaseline;

    @Column
    private Double timeInServiceManualBaseline;

    @Convert(converter = AeroApiKeyConverter.class)
    @Column
    private String aeroApiKey;

    public User(){

    }

    public User(String username, String password){
        this.username = username;
        this.password = password;
        this.blockTimeHours = 0.0;
        this.timeInServiceHours = 0.0;
        this.makeModel = ""; 
        this.tailNumber = "";
        this.ownerName = "";
        this.makeModelSN = "";
        this.aeroApiKey = "";

    }

    public User(String username, String password, double blockTimeHours, double timeInServiceHours){
        this.username = username;
        this.password = password;
        this.blockTimeHours = blockTimeHours;
        this.timeInServiceHours = timeInServiceHours;
        this.makeModel = ""; 
        this.tailNumber = "";
        this.ownerName = "";
        this.makeModelSN = "";

    }

    public long getId() {
        return Id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public List<ServiceTimeline> getServiceTimeline() {
        return serviceTimeline;
    }
    
    public Double getBlockTimeHours() {
        return blockTimeHours !=null ? blockTimeHours : 0.0;
    }

    public void setBlockTimeHours(Double blockTimeHours) {
        this.blockTimeHours = (blockTimeHours != null) ? blockTimeHours : 0.0;
    }

    public Double getTimeInServiceHours() {
        return timeInServiceHours !=null ? timeInServiceHours : 0.0;
    }

    public void setTimeInServiceHours(Double timeInServiceHours) {
        this.timeInServiceHours = (timeInServiceHours != null) ? timeInServiceHours : 0.0;
    }

    public void setId(long id) {
        Id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setServiceTimeline(List<ServiceTimeline> serviceTimeline) {
        this.serviceTimeline = serviceTimeline;
    }

    public String getMakeModel() { 
        return makeModel; 
    }
    public void setMakeModel(String makeModel) { 
        this.makeModel = makeModel; 
    }

    public String getTailNumber() { 
        return tailNumber; 
    }

    public void setTailNumber(String tailNumber) { 
        this.tailNumber = tailNumber; 
    }

    public String getOwnerName() { 
        return ownerName; 
    }
    
    public void setOwnerName(String ownerName) { 
        this.ownerName = ownerName; 
    }

    public String getMakeModelSN() { 
        return makeModelSN; 
    }
    
    public void setMakeModelSN(String makeModelSN) { 
        this.makeModelSN = makeModelSN; 
    }

    public List<FlightLog> getFlightLogs() {
        return flightLogs;
    }
    
    public void setFlightLogs(List<FlightLog> flightLogs) {
        this.flightLogs = flightLogs;
    }

    public java.time.Instant getBlockTimeUpdatedAt() { return blockTimeUpdatedAt; }
    public void setBlockTimeUpdatedAt(java.time.Instant blockTimeUpdatedAt) { this.blockTimeUpdatedAt = blockTimeUpdatedAt; }

    public java.time.Instant getTimeInServiceUpdatedAt() { return timeInServiceUpdatedAt; }
    public void setTimeInServiceUpdatedAt(java.time.Instant timeInServiceUpdatedAt) { this.timeInServiceUpdatedAt = timeInServiceUpdatedAt; }

    public String getBlockTimeUpdatedSource() { return blockTimeUpdatedSource; }
    public void setBlockTimeUpdatedSource(String blockTimeUpdatedSource) { this.blockTimeUpdatedSource = blockTimeUpdatedSource; }

    public String getTimeInServiceUpdatedSource() { return timeInServiceUpdatedSource; }
    public void setTimeInServiceUpdatedSource(String timeInServiceUpdatedSource) { this.timeInServiceUpdatedSource = timeInServiceUpdatedSource; }

    // Nullable on purpose: callers must distinguish "never set" from "set to 0".
    public Double getBlockTimeManualBaseline() { return blockTimeManualBaseline; }
    public void setBlockTimeManualBaseline(Double blockTimeManualBaseline) { this.blockTimeManualBaseline = blockTimeManualBaseline; }

    public Double getTimeInServiceManualBaseline() { return timeInServiceManualBaseline; }
    public void setTimeInServiceManualBaseline(Double timeInServiceManualBaseline) { this.timeInServiceManualBaseline = timeInServiceManualBaseline; }

    public String getAeroApiKey() {
        return aeroApiKey;
    }

    public void setAeroApiKey(String aeroApiKey) {
        this.aeroApiKey = aeroApiKey;
    }
}