# ATC Simulator - Air Traffic Control Training Game

## Overview
**ATC Simulator** is an interactive web-based air traffic control management game. Take control of an airport and manage incoming and departing aircraft by issuing landing clearances, takeoff assignments, taxi instructions, and holding patterns.

## Features

### Airport Configuration
- **4 Runways**: 06, 24 (for landings/takeoffs on one axis) and 07, 25 (for the perpendicular axis)
- **8 Waiting Points**: 
  - C1, C2, C7, C8 (for runway 06/24 operations)
  - A1, A2, A7, A8 (for runway 07/25 operations)
- **Interactive Map**: Real-time visualization of aircraft positions with zoom controls

### Aircraft Management
- **8 Aircraft Types**: Mix of regular aircraft (A320, A319, B737, B757) and heavy aircraft (A380, B747, B777, A350)
- **Dynamic States**: Aircraft can be "in air" (approaching) or "on ground" (ready for takeoff)
- **Live Tracking**: All aircraft movements displayed on the map with visual highlights

### Flight Control Commands

#### For Aircraft In Air (Landing)
- Assign landing runways (06, 24, 07, 25)
- Issue hold and wait commands to manage approach flow

#### For Aircraft On Ground (Takeoff)
- Assign takeoff runways (06, 24, 07, 25)
- Assign taxi routes to waiting points
- Issue hold commands for ground delay

#### For All Aircraft
- **Hold Position**: Stop all movement
- **Wait in Airspace**: Hold pattern at current position

## How to Play

1. **Select an Aircraft**: Click on any flight in the "Active Flights" panel (left side)
   - Hover over flights to highlight them with a green border
   - Click to select and view details

2. **View Aircraft Details**: Once selected, the aircraft information appears showing:
   - Callsign and aircraft type
   - Current status and position
   
3. **Issue Commands**: Available commands change based on aircraft location:
   - **In Air**: See runway landing options and holding commands
   - **On Ground**: See runway takeoff options and taxi assignments

4. **Monitor Activity**: The Activity Log (bottom right) records all commands and aircraft movements

## Game Mechanics

### Aircraft Movement
- Aircraft automatically move toward assigned destinations
- Landing aircraft move toward assigned runways
- Ground aircraft move toward assigned waiting points
- Aircraft complete their maneuver when reaching destination

### Status Types
- **approaching**: Aircraft in air, approaching airport
- **landing**: Aircraft assigned to runway, descending
- **taking-off**: Aircraft pushing back from gate/stand
- **taxing**: Aircraft moving to waiting point or runway
- **waiting**: Aircraft holding at current position
- **on-ground**: Aircraft parked at gate/stand

## Controls

### Map Zoom
- **+** button: Zoom in for detailed view
- **-** button: Zoom out for wider view

### Aircraft Selection
Click on any flight in the Active Flights list to select and control it.

### Command Buttons
Select an aircraft, then click any available command button to issue instructions.

## Technical Details

- **Built with**: HTML5, CSS3, Vanilla JavaScript
- **Graphics**: Canvas-based 2D map rendering
- **Real-time**: 60 FPS animation loop for smooth aircraft movement

---

**Note**: This simulator is designed for educational and entertainment purposes to understand basic air traffic control operations.