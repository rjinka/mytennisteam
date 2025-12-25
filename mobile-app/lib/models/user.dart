class User {
  final String id;
  final String name;
  final String email;
  final String? picture;
  final bool isSuperAdmin;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.picture,
    required this.isSuperAdmin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      picture: json['picture'],
      isSuperAdmin: json['isSuperAdmin'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'picture': picture,
      'isSuperAdmin': isSuperAdmin,
    };
  }
}
