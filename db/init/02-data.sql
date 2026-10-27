CREATE DATABASE IF NOT EXISTS socioclub;
USE socioclub;

CREATE TABLE IF NOT EXISTS actividades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    disciplina VARCHAR(100),
    profesor VARCHAR(255),
    dias VARCHAR(100),
    horario VARCHAR(50),
    edad_minima INT,
    edad_maxima INT,
    cupo_maximo INT,
    cuota_mensual DOUBLE
);

CREATE TABLE IF NOT EXISTS socios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    estado_cuota VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_inscripcion DATE,
    estado VARCHAR(20),
    socio_id BIGINT,
    actividad_id BIGINT,
    FOREIGN KEY (socio_id) REFERENCES socios(id),
    FOREIGN KEY (actividad_id) REFERENCES actividades(id)
);

INSERT INTO actividades (nombre, disciplina, profesor, dias, horario, edad_minima, edad_maxima, cupo_maximo, cuota_mensual) VALUES
('Fútbol infantil', 'Fútbol', 'Diego Ferreyra', 'Lun y Mié', '18:00', 6, 12, 40, 18000),
('Vóley mixto', 'Vóley', 'Laura Ceballos', 'Mar y Jue', '19:00', 13, 60, 24, 20000),
('Básquet juvenil', 'Básquet', 'Martín Oviedo', 'Lun y Vie', '19:30', 12, 17, 20, 19000),
('Natación', 'Natación', 'Sofía Bustos', 'Mar y Jue', '17:00', 5, 70, 30, 26000),
('Patín artístico', 'Patín', 'Carla Peralta', 'Mié y Vie', '17:30', 5, 15, 25, 21000),
('Ajedrez', 'Ajedrez', 'Raúl Giménez', 'Sáb', '10:00', 8, 99, 16, 9000),
('Funcional adultos', 'Fitness', 'Paula Luna', 'Lun, Mié y Vie', '20:30', 18, 65, 30, 22000),
('Yoga', 'Bienestar', 'Inés Arguello', 'Mar y Jue', '09:00', 16, 99, 15, 17000);

INSERT INTO socios (dni, nombre, apellido, fecha_nacimiento, email, telefono, estado_cuota) VALUES
('45123456', 'Thiago', 'Molina', '2018-04-12', 'thiago@mail.com', '3514000001', 'AL_DIA'),
('40234567', 'Valentina','Ríos', '2012-08-03', 'valen@mail.com', '3514000002', 'AL_DIA'),
('35345678', 'Bruno', 'Castro', '2008-02-19', 'bruno@mail.com', '3514000003', 'MOROSO'),
('32456789', 'Camila', 'Ludueña', '1995-11-25', 'cami@mail.com', '3514000004', 'AL_DIA'),
('28567890', 'Roberto', 'Funes', '1980-06-30', 'roberto@mail.com', '3514000005', 'AL_DIA'),
('46678901', 'Mía', 'Paz', '2019-01-15', 'mia@mail.com', '3514000006', 'AL_DIA'),
('41789012', 'Franco', 'Sosa', '2010-09-08', 'franco@mail.com', '3514000007', 'MOROSO'),
('36890123', 'Lucía', 'Aguirre', '1992-03-22', 'lucia@mail.com', '3514000008', 'AL_DIA'),
('29901234', 'Oscar', 'Bustos', '1978-12-05', 'oscar@mail.com', '3514000009', 'AL_DIA'),
('47012345', 'Delfina', 'Ferro', '2020-07-11', 'delfi@mail.com', '3514000010', 'AL_DIA'),
('42123450', 'Ignacio', 'Peralta', '2011-05-28', 'nacho@mail.com', '3514000011', 'AL_DIA'),
('33234501', 'Martina', 'Cabrera', '1998-10-14', 'marti@mail.com', '3514000012', 'AL_DIA'),
('30345602', 'Héctor', 'Domínguez', '1982-08-19', 'hector@mail.com', '3514000013', 'AL_DIA'),
('48456703', 'Alma', 'Tejerina', '2021-02-06', 'alma@mail.com', '3514000014', 'AL_DIA'),
('43567804', 'Tomás', 'Quiroga', '2009-12-01', 'tomas@mail.com', '3514000015', 'AL_DIA');
