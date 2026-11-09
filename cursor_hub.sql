-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 09, 2026 at 04:54 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cursor_hub`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2a$10$BYV7BUL48oZyh13WXoUrGufyt9fm.etzorvwraQYMwEDzBrTTjG.O');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int NOT NULL,
  `nama_matkul` varchar(255) NOT NULL,
  `pengajar` varchar(255) NOT NULL,
  `jadwal` datetime NOT NULL,
  `jam_selesai` time NOT NULL,
  `ruangan` varchar(100) NOT NULL,
  `kode_sesi` varchar(50) NOT NULL,
  `link_modul` varchar(255) NOT NULL,
  `status_kelas` enum('Not Ready','Ongoing','Finished') NOT NULL DEFAULT 'Not Ready'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `nama_matkul`, `pengajar`, `jadwal`, `jam_selesai`, `ruangan`, `kode_sesi`, `link_modul`, `status_kelas`) VALUES
(1, 'Ethics in Informatics', 'Dennis Gunawan', '2026-11-08 17:30:00', '18:30:00', 'Gedung D501', 'CURSOR-BASDAT-01', 'https://example.com/modul-basdat', 'Ongoing'),
(2, 'Linear Algebra', 'Nyimas Dewi', '2026-11-11 18:00:00', '19:00:00', 'Gedung C0313', 'CURSOR-01', 'https://drive.google.com/drive/folders/1Pcqi5bnXmOmWw2A6QAKh3ZXE3LXJ91tWhttps://drive.google.com/drive/folders/1Pcqi5bnXmOmWw2A6QAKh3ZXE3LXJ91tW', 'Ongoing');

-- --------------------------------------------------------

--
-- Table structure for table `cursor_attendees_logch`
--

CREATE TABLE `cursor_attendees_logch` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `nim` varchar(50) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `status_kehadiran` enum('Check-In','Hadir Penuh') NOT NULL DEFAULT 'Check-In',
  `waktu_absen` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_check_out` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cursor_attendees_logch`
--

INSERT INTO `cursor_attendees_logch` (`id`, `class_id`, `nim`, `nama_lengkap`, `status_kehadiran`, `waktu_absen`, `waktu_check_out`) VALUES
(2, 1, '00000163974', 'Raihan Rizky Adriansyah', 'Check-In', '2026-11-08 16:19:40', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_kode_sesi` (`kode_sesi`);

--
-- Indexes for table `cursor_attendees_logch`
--
ALTER TABLE `cursor_attendees_logch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_class_nim` (`class_id`,`nim`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cursor_attendees_logch`
--
ALTER TABLE `cursor_attendees_logch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cursor_attendees_logch`
--
ALTER TABLE `cursor_attendees_logch`
  ADD CONSTRAINT `fk_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
