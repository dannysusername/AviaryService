package com.example.AviaryService.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.repositories.DescriptionOptionRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.repositories.UserRepository;
import java.util.List;

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
            timeline.setTimeLeft(timeLeft);
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
    public String updateTimeline(
            @PathVariable Long id,
            @RequestParam(required = false) String item,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String cycle,
            @RequestParam(required = false) String lastDone,
            @RequestParam(required = false) String dueDate,
            @RequestParam(required = false) String timeLeft,
            Authentication authentication) {
        ServiceTimeline timeline = serviceTimelineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid timeline ID: " + id));
        if (item != null) timeline.setItem(item);
        if (description != null) {
            timeline.setDescription(description);
            saveCustomDescriptionOption(description, userRepository.findByUsername(authentication.getName()));
        }
        if (cycle != null) timeline.setCycle(cycle);
        if (lastDone != null) timeline.setLastDone(lastDone);
        if (dueDate != null) timeline.setDueDate(dueDate);
        if (timeLeft != null) timeline.setTimeLeft(timeLeft);
        serviceTimelineRepository.save(timeline);
        return "redirect:/dashboard";
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