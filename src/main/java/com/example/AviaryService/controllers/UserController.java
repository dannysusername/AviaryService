package com.example.AviaryService.controllers;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.FlightLog;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.entity.DTO.TimelineUpdateDTO;
import com.example.AviaryService.repositories.DescriptionOptionRepository;
import com.example.AviaryService.repositories.FlightLogRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.repositories.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.transaction.Transactional;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class UserController {
    @Autowired private UserRepository userRepository;
    @Autowired private ServiceTimelineRepository serviceTimelineRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private DescriptionOptionRepository descriptionOptionRepository;
    @Autowired private FlightLogRepository flightLogRepository;

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username, @RequestParam String password, Model model) {
        if (userRepository.findByUsername(username) != null) { //If username exists
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

    @PostMapping("/updateUserInfo")
    @ResponseBody
    public ResponseEntity<Map<String, String>> updateUserInfo(
            @RequestBody Map<String, String> data,
            Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName());
            if (user == null) {
                throw new IllegalArgumentException("User not found");
            }

            // Update fields if provided in the request
            if (data.containsKey("makeModel")) user.setMakeModel(data.get("makeModel"));
            if (data.containsKey("tailNumber")) user.setTailNumber(data.get("tailNumber"));
            if (data.containsKey("ownerName")) user.setOwnerName(data.get("ownerName"));
            if (data.containsKey("makeModelSN")) user.setMakeModelSN(data.get("makeModelSN"));

            userRepository.save(user);

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

    @GetMapping("/dashboard")
    public String showDashboard(Model model, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username);
        model.addAttribute("username", username);
        model.addAttribute("timelines", serviceTimelineRepository.findByUserOrderByTimelineOrderAsc(user));
        model.addAttribute("descriptionOptions", descriptionOptionRepository.findByUser(user));
        model.addAttribute("currentHours", user.getHours());

        model.addAttribute("makeModel", user.getMakeModel());
        model.addAttribute("tailNumber", user.getTailNumber());
        model.addAttribute("ownerName", user.getOwnerName());
        model.addAttribute("makeModelSN", user.getMakeModelSN());
        model.addAttribute("flightlogs", flightLogRepository.findByUser(user));

            return "dashboard";
    }

    @PostMapping("/dashboard")
    public ResponseEntity<?> addTimeline(
        @RequestBody Map<String, String> data,
        Authentication authentication) {
    String item = data.get("item");
    if (item == null || item.isEmpty()) {
        return ResponseEntity.badRequest().body("Item is required");
    }

    String isTitle = data.getOrDefault("isTitle", "false");
    String description = data.get("description");
    String cycle = data.get("cycle");
    String lastDone = data.get("lastDone");
    String dueDate = data.get("dueDate");
    String timeLeft = data.get("timeLeft"); // POSSIBLY REMOVE THIS !!!
    String ajax = data.getOrDefault("ajax", "false");

    User user = userRepository.findByUsername(authentication.getName());
    ServiceTimeline timeline = new ServiceTimeline();
    timeline.setItem(item);
    boolean isTitleRow = "true".equals(isTitle);
    timeline.setIsTitle(isTitleRow);
    if (!isTitleRow) {
        if (description != null) { /* 
            String[] defaults = {"inspect", "test", "replace", "overhaul"};
            if (java.util.Arrays.asList(defaults).contains(description.toLowerCase())) {
                description = description.substring(0, 1).toUpperCase() + description.substring(1).toLowerCase();
            }*/
            timeline.setDescription(description);
            saveCustomDescriptionOption(description, user);
            
        }
        timeline.setCycle(cycle);
        timeline.setLastDone(lastDone);
        timeline.setDueDate(dueDate);
        timeline.setTimeLeft(timeLeft);  // POSSIBLY REMOVE THIS !!!
        // Automatically calculate timeLeft based on dueDate and user's hours


        /* 
        if (dueDate != null) {
            try {
                String[] parts = dueDate.split(" ");
                String datePart = parts[0];
                String hoursPart = parts.length > 1 ? parts[1] : null;
                StringBuilder timeLeftStr = new StringBuilder();

                // Calculate days
                LocalDate today = LocalDate.now();
                LocalDate due = LocalDate.parse(datePart);
                long daysLeft = ChronoUnit.DAYS.between(today, due);
                timeLeftStr.append(daysLeft < 0 ? Math.abs(daysLeft) + " days overdue" : daysLeft + " days left");

                // Calculate hours if present
                if (hoursPart != null && hoursPart.matches("\\d+")) {
                    int dueHours = Integer.parseInt(hoursPart);
                    int currentHours = user.getHours();
                    int hoursLeft = dueHours - currentHours;
                    timeLeftStr.append("\n")
                            .append(hoursLeft < 0 ? Math.abs(hoursLeft) + " hours overdue" : hoursLeft + " hours left");
                }

                timeline.setTimeLeft(timeLeftStr.toString());
            } catch (Exception e) {
                timeline.setTimeLeft("N/A");
            }
        }*/
    }
    timeline.setUser(user);

    Integer maxOrder = serviceTimelineRepository.findMaxTimelineOrderByUser(user);
    int newOrder = (maxOrder != null) ? maxOrder + 1 : 0;
    timeline.setTimelineOrder(newOrder);

    serviceTimelineRepository.save(timeline);

    if ("true".equals(ajax)) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", timeline.getId());
        response.put("item", timeline.getItem());
        response.put("description", timeline.getDescription());
        response.put("cycle", timeline.getCycle());
        response.put("lastDone", timeline.getLastDone());
        response.put("dueDate", timeline.getDueDate());
        response.put("timeLeft", timeline.getTimeLeft());
        response.put("isTitle", timeline.getIsTitle());
        return ResponseEntity.ok(response);
    } else {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/dashboard")).build();
    }
}

@PostMapping("/updateHours")
@ResponseBody
public ResponseEntity<Map<String, String>> updateHours(
        @RequestParam(required = false) Integer hoursToAdd,
        @RequestParam(required = false) Integer newTotalHours,
        Authentication authentication) {
    try {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        if (newTotalHours != null) {
            // Directly set the total hours (for current-hours editing)
            user.setHours(newTotalHours);
            System.out.println("Setting total hours to: " + newTotalHours);
        } else if (hoursToAdd != null) {
            // Add to existing hours (for add-hours button)
            int currentHours = user.getHours();
            user.setHours(currentHours + hoursToAdd);
            System.out.println("Adding " + hoursToAdd + " to current hours: " + currentHours);
        } else {
            throw new IllegalArgumentException("Either hoursToAdd or newTotalHours must be provided");
        }

        userRepository.save(user);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("newHours", String.valueOf(user.getHours()));
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", e.getMessage());
        System.out.println("Error updating hours: " + e.getMessage());
        return ResponseEntity.badRequest().body(errorResponse);
    }
}

    // Other existing methods remain unchanged...


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
                String description = updateDTO.getDescription();
                String[] defaults = {"inspect", "test", "replace", "overhaul"};
                if (java.util.Arrays.asList(defaults).contains(description.toLowerCase())) {
                    description = description.substring(0, 1).toUpperCase() + description.substring(1).toLowerCase();
                }
                timeline.setDescription(description);
                saveCustomDescriptionOption(description, userRepository.findByUsername(authentication.getName()));
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

    @DeleteMapping("/deleteOption/{id}")
    @ResponseBody
    @Transactional
    public ResponseEntity<String> deleteOption(@PathVariable Long id, Authentication authentication) {
        try {
            log.info("Attempting to delete option with ID: {}", id);
            User user = userRepository.findByUsername(authentication.getName());
            if (user == null) {
                log.error("User not found for username: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            log.info("Authenticated user: {}", user.getUsername());
            DescriptionOption option = descriptionOptionRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Option not found"));
            log.info("Found option: {} for user: {}", option.getOption(), option.getUser().getUsername());
            if (!option.getUser().equals(user)) {
                log.warn("User {} does not own option {}", user.getUsername(), option.getOption());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this option");
            }
            descriptionOptionRepository.delete(option);
            log.info("Option {} deleted successfully", option.getOption());
            return ResponseEntity.ok("Option deleted");
        } catch (Exception e) {
            log.error("Error deleting option with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting option: " + e.getMessage());
        }
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

    // NEW: GET flight logs (for AJAX if needed)
    @GetMapping("/flightlogs")
    @ResponseBody
    public List<FlightLog> getFlightLogs(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        return flightLogRepository.findByUser(user);
    }

    // NEW: POST to add flight log (now AJAX-friendly)
    @PostMapping(value = "/addflightlog", consumes = "application/json")
    @ResponseBody
    public ResponseEntity<FlightLog> addFlightLog(@RequestBody FlightLog newLog, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        newLog.setUser(user);
        FlightLog savedLog = flightLogRepository.save(newLog);
        return ResponseEntity.ok(savedLog);  // Return the saved entity as JSON
    }

    // NEW: DELETE flight log
    @DeleteMapping("/deleteflightlog/{id}")
    @ResponseBody
    @Transactional
    public ResponseEntity<String> deleteFlightLog(@PathVariable Long id, Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName());
            FlightLog log = flightLogRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Flight log not found"));
            if (!log.getUser().equals(user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this log");
            }
            flightLogRepository.delete(log);
            return ResponseEntity.ok("Flight log deleted");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting flight log: " + e.getMessage());
        }
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