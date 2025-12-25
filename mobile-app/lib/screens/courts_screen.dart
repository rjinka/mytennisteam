import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/court.dart';

class CourtsScreen extends StatelessWidget {
  const CourtsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, app, child) {
        if (app.courts.isEmpty) {
          return const Center(child: Text('No courts found'));
        }

        return ListView.builder(
          itemCount: app.courts.length,
          itemBuilder: (context, index) {
            final Court court = app.courts[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFF2d3748),
              child: ListTile(
                leading: const Icon(Icons.sports_tennis, color: Colors.white),
                title: Text(
                  court.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
