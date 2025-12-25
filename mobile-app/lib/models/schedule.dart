class ScheduleCourt {
  final String courtId;
  final String gameType; // '0': Singles, '1': Doubles

  ScheduleCourt({
    required this.courtId,
    required this.gameType,
  });

  factory ScheduleCourt.fromJson(Map<String, dynamic> json) {
    return ScheduleCourt(
      courtId: json['courtId'],
      gameType: json['gameType']?.toString() ?? '0',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'courtId': courtId,
      'gameType': gameType,
    };
  }
}

class Schedule {
  final int occurrenceNumber;
  final String id;
  final String name;
  final String groupId;
  final int day;
  final String time;
  final int duration;
  final bool recurring;
  final int frequency;
  final int recurrenceCount;
  final int maxPlayersCount;
  final bool isRotationGenerated;
  final List<ScheduleCourt> courts;
  final List<String> playingPlayersIds;
  final List<String> benchPlayersIds;
  final List<String> backupPlayersIds;
  final String status; // 'PLANNING' | 'ACTIVE' | 'COMPLETED'

  Schedule({
    required this.occurrenceNumber,
    required this.id,
    required this.name,
    required this.groupId,
    required this.day,
    required this.time,
    required this.duration,
    required this.recurring,
    required this.frequency,
    required this.recurrenceCount,
    required this.maxPlayersCount,
    required this.isRotationGenerated,
    required this.courts,
    required this.playingPlayersIds,
    required this.benchPlayersIds,
    required this.backupPlayersIds,
    required this.status,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    int toInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      if (value is double) return value.toInt();
      return 0;
    }

    return Schedule(
      occurrenceNumber: toInt(json['occurrenceNumber']),
      id: json['id'],
      name: json['name'],
      groupId: json['groupId'],
      day: toInt(json['day']),
      time: json['time'],
      duration: toInt(json['duration']),
      recurring: json['recurring'] ?? false,
      frequency: toInt(json['frequency']),
      recurrenceCount: toInt(json['recurrenceCount']),
      maxPlayersCount: toInt(json['maxPlayersCount']),
      isRotationGenerated: json['isRotationGenerated'] ?? false,
      courts: (json['courts'] as List<dynamic>?)
              ?.map((e) => ScheduleCourt.fromJson(e))
              .toList() ??
          [],
      playingPlayersIds: List<String>.from(json['playingPlayersIds'] ?? []),
      benchPlayersIds: List<String>.from(json['benchPlayersIds'] ?? []),
      backupPlayersIds: List<String>.from(json['backupPlayersIds'] ?? []),
      status: json['status'] ?? 'PLANNING',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'occurrenceNumber': occurrenceNumber,
      'id': id,
      'name': name,
      'groupId': groupId,
      'day': day,
      'time': time,
      'duration': duration,
      'recurring': recurring,
      'frequency': frequency,
      'recurrenceCount': recurrenceCount,
      'maxPlayersCount': maxPlayersCount,
      'isRotationGenerated': isRotationGenerated,
      'courts': courts.map((e) => e.toJson()).toList(),
      'playingPlayersIds': playingPlayersIds,
      'benchPlayersIds': benchPlayersIds,
      'backupPlayersIds': backupPlayersIds,
      'status': status,
    };
  }
}
