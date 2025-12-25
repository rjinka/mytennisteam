class Court {
  final String id;
  final String name;
  final String groupId;

  Court({
    required this.id,
    required this.name,
    required this.groupId,
  });

  factory Court.fromJson(Map<String, dynamic> json) {
    return Court(
      id: json['id'],
      name: json['name'],
      groupId: json['groupId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'groupId': groupId,
    };
  }
}
