import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/schedule.dart';

class SchedulesScreen extends StatelessWidget {
  const SchedulesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, app, child) {
        if (app.schedules.isEmpty) {
          return const Center(child: Text('No schedules found'));
        }

        return ListView.builder(
          itemCount: app.schedules.length,
          itemBuilder: (context, index) {
            final Schedule schedule = app.schedules[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFF2d3748),
              child: ListTile(
                title: Text(
                  schedule.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${schedule.time} - ${schedule.duration} mins',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    Text(
                      'Status: ${schedule.status}',
                      style: TextStyle(
                        color: schedule.status == 'ACTIVE' ? Colors.greenAccent : Colors.orangeAccent,
                      ),
                    ),
                  ],
                ),
                trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white54),
                onTap: () {
                  // TODO: Navigate to Schedule Details
                },
              ),
            );
          },
        );
      },
    );
  }
}
