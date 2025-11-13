package com.example.AviaryService.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "service_timelines") // Assuming a table name; adjust if different
public class ServiceTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String item;

    @Column
    private boolean isTitle;

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

    @Column
    private Integer timelineOrder;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    // Constructors
    public ServiceTimeline() {}

    public ServiceTimeline(String item, boolean isTitle, String description, String cycle, String lastDone, String dueDate, String timeLeft, User user) {
        this.item = item;
        this.isTitle = isTitle;
        this.description = description;
        this.cycle = cycle;
        this.lastDone = lastDone;
        this.dueDate = dueDate;
        this.timeLeft = timeLeft;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItem() { return item; }
    public void setItem(String item) { this.item = item; }

    public boolean getIsTitle() { return isTitle; }
    public void setIsTitle(boolean isTitle) { this.isTitle = isTitle; }

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

    public Integer getTimelineOrder() { return timelineOrder; }
    public void setTimelineOrder(Integer timelineOrder) { this.timelineOrder = timelineOrder; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}