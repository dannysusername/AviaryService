package com.example.AviaryService.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.entity.DTO.TimelineUpdateDTO;
import com.example.AviaryService.repositories.DescriptionOptionRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.repositories.UserRepository;

import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class UserController {
    @Autowired private UserRepository userRepository;
    @Autowired private ServiceTimelineRepository serviceTimelineRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private DescriptionOptionRepository descriptionOptionRepository;

    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username, @RequestParam String password, Model model) {
        if (userRepository.findByUsername(username) != null) {
            model.addAttribute("error", "Username already exists");
            return "register";
        }
        User user = new User(username, passwordEncoder.encode(password));
        userRepository.save(user);
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    @GetMapping("/dashboard")
    public String showDashboard(Model model, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username);
        List<ServiceTimeline> timelines = serviceTimelineRepository.findByUserOrderByIdAsc(user);

        LocalDate today = LocalDate.now();
        for(ServiceTimeline timeline : timelines) {
            //If its not a title and due date has value
            if(!timeline.isTitle() && timeline.getDueDate() != null){
                //if timeleft is empty OR timeleft doesnt match the regex

                try{
                    
                    LocalDate dueDate = LocalDate.parse(timeline.getDueDate());
                    long daysLeft = ChronoUnit.DAYS.between(today, dueDate);
                    String timeLeftText;
                    if(daysLeft < 0) {
                        timeLeftText = Math.abs(daysLeft) + " days overdue";
                    } else {
                        timeLeftText = daysLeft + " days left";
                    }
                    timeline.setTimeLeft(timeLeftText);
                    serviceTimelineRepository.save(timeline);

                } catch (Exception e){
                    System.out.println("Error parsing dates for timelines " + timeline.getId() + ": " + e.getMessage());
                    timeline.setTimeLeft("N/A");
                    serviceTimelineRepository.save(timeline);
                }        
            }
        }

        model.addAttribute("username", username);
        model.addAttribute("timelines", serviceTimelineRepository.findByUserOrderByIdAsc(user));
        model.addAttribute("descriptionOptions", descriptionOptionRepository.findByUser(user));
        return "dashboard";
    }

    @PostMapping("/dashboard")
    public String addTimeline(
        @RequestParam String item,
        @RequestParam(required = false) String isTitle,
        @RequestParam(required = false) String description,
        @RequestParam(required = false) String cycle,
        @RequestParam(required = false) String lastDone,
        @RequestParam(required = false) String dueDate,
        @RequestParam(required = false) String timeLeft,
        Authentication authentication) {
            System.out.println("Adding timeline for user");
        User user = userRepository.findByUsername(authentication.getName());
        ServiceTimeline timeline = new ServiceTimeline();
        timeline.setItem(item);
        boolean isTitleRow = "true".equals(isTitle);
        timeline.setIsTitle(isTitleRow);
        if (!isTitleRow) {
            if (description != null) {
                timeline.setDescription(description);
                saveCustomDescriptionOption(description, user);
            }
            timeline.setCycle(cycle);
            timeline.setLastDone(lastDone);
            timeline.setDueDate(dueDate);
            if (dueDate != null) {
                try {
                    LocalDate today = LocalDate.now();
                    LocalDate due = LocalDate.parse(dueDate);
                    long daysLeft = ChronoUnit.DAYS.between(today, due);
                    timeline.setTimeLeft(daysLeft < 0 ? Math.abs(daysLeft) + " days overdue" : daysLeft + " days");
                } catch (Exception e) {
                    timeline.setTimeLeft("N/A");
                }
            }
        }
        timeline.setUser(user);

        // Set timelineOrder
        Integer maxOrder = serviceTimelineRepository.findMaxTimelineOrderByUser(user);
        int newOrder = (maxOrder != null) ? maxOrder + 1 : 0;
        timeline.setTimelineOrder(newOrder);

        serviceTimelineRepository.save(timeline);

        System.out.println("Timeline saved");
        return "redirect:/dashboard";
    }

    @PostMapping("/update/{id}")
    @ResponseBody
    @Transactional
    public ResponseEntity<Map<String, String>> updateTimeline(
            @PathVariable Long id,
            @RequestBody TimelineUpdateDTO updateDTO,
            Authentication authentication) {
        try {
            ServiceTimeline timeline = serviceTimelineRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid timeline ID: " + id));

                    System.out.println("Received updateDTO: item=" + updateDTO.getItem() + ", cycle=" + updateDTO.getCycle() + 
                    ", description=" + updateDTO.getDescription() + ", lastDone=" + updateDTO.getLastDone() + 
                    ", dueDate=" + updateDTO.getDueDate() + ", timeLeft=" + updateDTO.getTimeLeft());

            if (updateDTO.getItem() != null) timeline.setItem(updateDTO.getItem());
            if (updateDTO.getDescription() != null) {
                timeline.setDescription(updateDTO.getDescription());
                saveCustomDescriptionOption(updateDTO.getDescription(), userRepository.findByUsername(authentication.getName()));
            }
            if (updateDTO.getCycle() != null) timeline.setCycle(updateDTO.getCycle());
            if (updateDTO.getLastDone() != null) timeline.setLastDone(updateDTO.getLastDone());
            if (updateDTO.getDueDate() != null) {
                timeline.setDueDate(updateDTO.getDueDate());
                timeline.setTimeLeft(updateDTO.getTimeLeft()); // Use timeLeft from client if provided
            }
            
            ServiceTimeline savedTimeline = serviceTimelineRepository.save(timeline);
            System.out.println("Saved timeline with item: " +savedTimeline.getItem() + ", " + savedTimeline.getCycle() + ", " + savedTimeline.getDescription() + ", " + savedTimeline.getLastDone() + ", " + savedTimeline.getDueDate() + ", " + savedTimeline.getTimeLeft());

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }


    @DeleteMapping("/delete/{id}")
    @ResponseBody
    public void deleteTimeline(@PathVariable Long id) {
        ServiceTimeline timeline = serviceTimelineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid timeline ID: " + id));
        serviceTimelineRepository.delete(timeline);
    }

    @PostMapping("/updateOrder")
    @ResponseBody
    public void updateOrder(@RequestBody List<Long> ids, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        List<ServiceTimeline> timelines = serviceTimelineRepository.findByUserOrderByIdAsc(user);
        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            ServiceTimeline timeline = timelines.stream()
                .filter(t -> t.getId() == id)
                .findFirst()
                .orElse(null);
            if (timeline != null) {
                timeline.setTimelineOrder(i);
            }
        }
        serviceTimelineRepository.saveAll(timelines);
    }

    private void saveCustomDescriptionOption(String description, User user) {
        if (description != null) {
            String[] defaults = {"inspect", "test", "replace", "overhaul"};
            if (!java.util.Arrays.asList(defaults).contains(description)) {
                if (!descriptionOptionRepository.findByUser(user).stream().anyMatch(opt -> opt.getOption().equals(description))) {
                    descriptionOptionRepository.save(new DescriptionOption(description, user));
                }
            }
        }
    }
}