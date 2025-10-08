import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/feed_screen.dart';

void main() {
  runApp(const UstbianApp());
}

class UstbianApp extends StatelessWidget {
  const UstbianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ustbian',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      setState(() {
        _isAuthenticated = token != null;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isAuthenticated = false;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return _isAuthenticated ? const FeedScreen() : const LoginScreen();
  }
}
