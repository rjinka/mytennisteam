class PlayerAvailability {
  final String scheduleId;
  final String type; // 'Rotation' | 'Permanent' | 'Backup'

  PlayerAvailability({
    required this.scheduleId,
    required this.type,
  });

  factory PlayerAvailability.fromJson(Map<String, dynamic> json) {
    return PlayerAvailability(
      scheduleId: json['scheduleId'],
      type: json['type'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'scheduleId': scheduleId,
      'type': type,
    };
  }
}

class Player {
  final String id;
  final String userId;
  final String name;
  final String email;
  final String groupId;
  final List<PlayerAvailability> availability;
  final String? picture;

  Player({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.groupId,
    required this.availability,
    this.picture,
  });

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'],
      userId: json['userId'],
      name: json['name'] ?? 'Unknown',
      email: json['email'] ?? '',
      groupId: json['groupId'],
      availability: (json['availability'] as List<dynamic>?)
              ?.map((e) => PlayerAvailability.fromJson(e))
              .toList() ??
          [],
      picture: json['picture'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'email': email,
      'groupId': groupId,
      'availability': availability.map((e) => e.toJson()).toList(),
      'picture': picture,
    };
  }
}
