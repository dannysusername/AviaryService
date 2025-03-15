package com.example.AviaryService.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.AviaryService.entity.User;

public interface UserRepository extends JpaRepository<User, Long>{ 
    User findByUsername(String username);
    
}
