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

    public User(){

    }

    public User(String username, String password){
        this.username = username;
        this.password = password;

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

    


}
