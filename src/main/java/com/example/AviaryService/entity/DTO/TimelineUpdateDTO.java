package com.example.AviaryService.entity.DTO;

public class TimelineUpdateDTO {
    private String item;
    private String description;
    private String cycle;
    private String lastDone;
    private String dueDate;
    private String timeLeft;

    // Default constructor (required for Jackson deserialization)
    public TimelineUpdateDTO() {}

    // Getters and Setters
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
}