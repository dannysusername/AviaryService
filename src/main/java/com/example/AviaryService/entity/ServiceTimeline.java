package com.example.AviaryService.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "service_timeline")
public class ServiceTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String item;

    @Column
    private String description;

    @Column
    private String cycle;

    @Column
    private String lastDone;

    @Column
    private String dueDate;

    @Column 
    private String timeLeft;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column
    private Boolean isTitle;

    @Column(name = "timeline_order")
    private Integer timelineOrder;

    // Constructors
    public ServiceTimeline() {}
    
    public ServiceTimeline(long id, String item, String description, String cycle, String lastDone, String dueDate, String timeLeft) {
        this.id = id;
        this.item = item;
        this.description = description;
        this.cycle = cycle;
        this.lastDone = lastDone;
        this.dueDate = dueDate;
        this.timeLeft = timeLeft;
    }

    // Getters and Setters
    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getItem() { return item; }
    public void setItem(String item) { this.item = item; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCycle() { return cycle; }
    public void setCycle(String cycle) { this.cycle = cycle; }
    public String getLastDone() { return lastDone; }
    public void setLastDone(String lastDone) { this.lastDone = lastDone; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public String getTimeLeft() { return timeLeft; }
    public void setTimeLeft(String timeLeft) { this.timeLeft = timeLeft; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    
    public Boolean isTitle() { return isTitle; }
    public void setIsTitle(Boolean isTitle) { this.isTitle = isTitle; }

    public Integer getTimelineOrder() { return timelineOrder; }
    public void setTimelineOrder(Integer timelineOrder) { this.timelineOrder = timelineOrder; }
}