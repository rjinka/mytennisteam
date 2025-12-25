import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/group.dart';

class GroupSelector extends StatelessWidget {
  const GroupSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, app, child) {
        if (app.groups.isEmpty) {
          return const Center(child: Text('No groups found'));
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: DropdownButtonFormField<Group>(
            initialValue: app.currentGroup,
            decoration: InputDecoration(
              labelText: 'Select Group',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.white.withOpacity(0.1),
            ),
            dropdownColor: const Color(0xFF1a1b26),
            style: const TextStyle(color: Colors.white),
            items: app.groups.map((Group group) {
              return DropdownMenuItem<Group>(
                value: group,
                child: Text(group.name),
              );
            }).toList(),
            onChanged: (Group? newValue) {
              if (newValue != null) {
                app.setCurrentGroup(newValue);
              }
            },
          ),
        );
      },
    );
  }
}
