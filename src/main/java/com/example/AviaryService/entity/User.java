package com.example.AviaryService.entity;

import jakarta.persistence.*;
import java.util.List;

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
    private List<ServiceTimeline> serviceTimeline;

    @Column
    private Integer hours; // New field to store total hours

    @Column
    private String makeModel;

    @Column
    private String tailNumber;

    @Column
    private String ownerName;

    @Column
    private String makeModelSN;

    public User(){

    }

    public User(String username, String password){
        this.username = username;
        this.password = password;
        this.hours = 0;
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
    
    public Integer getHours() {
        return hours != null ? hours : 0;
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

    public void setHours(Integer hours) {
        this.hours = (hours != null) ? hours : 0;
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

    


}
