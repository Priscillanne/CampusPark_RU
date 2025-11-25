# CampusPark_RU
- A Smart Campus Parking System
- A comprehensive smart parking management system designed for universities and campuses. This system provides real-time parking slot booking, zone management, user session tracking, and automated penalty calculations.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Ionic](https://img.shields.io/badge/Ionic-6.0.0-purple)
![Firebase](https://img.shields.io/badge/Firebase-9.0+-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)

## Features

### Core Functionality
- **Real-time Parking Booking** - Book available parking slots instantly
- **Zone-based Management** - Organized parking zones (A-F) with capacity tracking
- **User Session Management** - Track active and historical parking sessions
- **Smart Penalty System** - Automated overtime detection and penalty calculations
- **Live Availability** - Real-time slot availability updates

### User Features
- **Student/Staff Profiles** - Different user types with specific parking privileges
- **Booking Management** - Create, edit, and delete parking reservations
- **Session History** - Complete history of all parking sessions
- **Car Plate Management** - Register and manage multiple vehicle plates
- **Real-time Notifications** - Booking confirmations and penalty alerts

### Admin Features
- **Zone Configuration** - Manage parking zones and capacities
- **User Management** - Monitor and manage user accounts
- **Analytics Dashboard** - Parking usage statistics and reports
- **Penalty Management** - Oversee penalty system and exceptions

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

# Firebase Project Documentation

## Project Overview
This project uses Firebase as the backend service for managing various data entities including bookings, classrooms, parking, users, and zones.

## Firebase Collections

The project utilizes the following Firebase Firestore collections:

### Core Collections

#### **bookings**
- General booking system for reservations
- Handles appointment and resource scheduling

#### **classrooms**
- Manages classroom information and availability
- Tracks educational space resources

#### **parkingBookings**
- Parking reservation management system
- Handles parking spot bookings and scheduling

#### **parkingSlots**
- Database of available parking spaces
- Manages parking slot inventory and status

#### **penaltyPayments**
- Tracks penalty charges and payments
- Manages fine collection and payment records

#### **sessions**
- User session management
- Tracks active sessions and authentication states

#### **users**
- User account management
- Stores user profiles and authentication data

### Zone Management

#### **zone** (singular)
- Individual zone configuration
- Zone-specific settings and properties

#### **zones** (plural)
- Comprehensive zone management
- Collection of all available zones


### Authentication
- User authentication handled through Firebase Auth
- Session management integrated with Firestore

## Setup Instructions

### Prerequisites
- Firebase project configured
- Firestore database initialized
- Authentication enabled (if required)

### Installation
1. Clone the repository
2. Install Firebase SDK
3. Configure Firebase credentials
4. Initialize Firestore connection

### Environment Variables
```javascript
// Firebase configuration
  apiKey: "AIzaSyADkPx2syGdRD08m4nE5SnLbNfDnW58jOs",
  authDomain: "campuspark-ru.firebaseapp.com",
  projectId: "campuspark-ru",
  storageBucket: "campuspark-ru.firebasestorage.app",
  messagingSenderId: "791070736327",
  appId: "1:791070736327:web:2371d7406a55f6ffbea3e2",
  measurementId: "G-6FJWF2J8D9"
};

### FIREBASE TABLE UPDATING
-- Users table (existing)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role ENUM('student', 'teacher', 'staff', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Zones table (existing)
CREATE TABLE zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parking slots table
CREATE TABLE parkingSlots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    zone_id INT,
    slot_number VARCHAR(20) NOT NULL,
    slot_type ENUM('standard', 'disabled', 'reserved', 'electric') DEFAULT 'standard',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);

-- Parking bookings table
CREATE TABLE parkingBookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    parking_slot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_slot_id) REFERENCES parkingSlots(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking (parking_slot_id, booking_date, start_time)
);

-- Penalty payments table
CREATE TABLE penaltyPayments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    parking_booking_id INT,
    penalty_type ENUM('late_cancellation', 'no_show', 'overtime') NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    status ENUM('pending', 'paid', 'waived') DEFAULT 'pending',
    penalty_date DATE NOT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_booking_id) REFERENCES parkingBookings(id) ON DELETE SET NULL
);

-- Sessions table (existing)
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Classrooms table (existing)
CREATE TABLE classrooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    zone_id INT,
    capacity INT,
    facilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);

-- Bookings table (existing - for classroom bookings)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    classroom_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

