
package com.example.AviaryService.controllers;

//import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.repositories.DescriptionOptionRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.repositories.UserRepository;



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
        @RequestParam(required = false) String description,
        @RequestParam(required = false) String cycle,
        @RequestParam(required = false) String lastDone,
        @RequestParam(required = false) String dueDate,
        @RequestParam(required = false) String timeLeft,
        Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        ServiceTimeline timeline = new ServiceTimeline();
        timeline.setItem(item);
        if (description != null) {
            timeline.setDescription(description);
            saveCustomDescriptionOption(description, user);
        }
        timeline.setCycle(cycle);
        timeline.setLastDone(lastDone);
        timeline.setDueDate(dueDate);
        timeline.setTimeLeft(timeLeft);
        timeline.setUser(user);
        serviceTimelineRepository.save(timeline);
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