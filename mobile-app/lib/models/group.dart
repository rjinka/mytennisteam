class Group {
  final String id;
  final String name;
  final List<String> admins;
  final String? joinCode;

  Group({
    required this.id,
    required this.name,
    required this.admins,
    this.joinCode,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'],
      name: json['name'],
      admins: List<String>.from(json['admins'] ?? []),
      joinCode: json['joinCode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'admins': admins,
      'joinCode': joinCode,
    };
  }
}
