import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/player.dart';

class PlayersScreen extends StatelessWidget {
  const PlayersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, app, child) {
        if (app.players.isEmpty) {
          return const Center(child: Text('No players found'));
        }

        return ListView.builder(
          itemCount: app.players.length,
          itemBuilder: (context, index) {
            final Player player = app.players[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFF2d3748),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundImage: player.picture != null ? NetworkImage(player.picture!) : null,
                  child: player.picture == null ? Text(player.name[0].toUpperCase()) : null,
                ),
                title: Text(
                  player.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  player.email,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
