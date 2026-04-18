package com.zerojuice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class ZerojuiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ZerojuiceApplication.class, args);
	}

}
