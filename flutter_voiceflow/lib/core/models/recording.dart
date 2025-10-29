enum EnhancementStyle {
  note,
  email,
  blog,
  summary,
  transcript,
  custom,
}

class Recording {
  final String id;
  final String title;
  final String audioUri;
  final int duration; // in seconds
  final DateTime createdAt;
  final String? transcript;
  final String? enhancedTranscript;
  final EnhancementStyle style;
  final String language;
  final List<String> tags;
  final bool isProcessing;
  final int processingProgress; // 0-100

  Recording({
    required this.id,
    required this.title,
    required this.audioUri,
    required this.duration,
    required this.createdAt,
    this.transcript,
    this.enhancedTranscript,
    this.style = EnhancementStyle.note,
    this.language = 'en-US',
    this.tags = const [],
    this.isProcessing = false,
    this.processingProgress = 0,
  });

  Recording copyWith({
    String? id,
    String? title,
    String? audioUri,
    int? duration,
    DateTime? createdAt,
    String? transcript,
    String? enhancedTranscript,
    EnhancementStyle? style,
    String? language,
    List<String>? tags,
    bool? isProcessing,
    int? processingProgress,
  }) {
    return Recording(
      id: id ?? this.id,
      title: title ?? this.title,
      audioUri: audioUri ?? this.audioUri,
      duration: duration ?? this.duration,
      createdAt: createdAt ?? this.createdAt,
      transcript: transcript ?? this.transcript,
      enhancedTranscript: enhancedTranscript ?? this.enhancedTranscript,
      style: style ?? this.style,
      language: language ?? this.language,
      tags: tags ?? this.tags,
      isProcessing: isProcessing ?? this.isProcessing,
      processingProgress: processingProgress ?? this.processingProgress,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'audioUri': audioUri,
      'duration': duration,
      'createdAt': createdAt.toIso8601String(),
      'transcript': transcript,
      'enhancedTranscript': enhancedTranscript,
      'style': style.name,
      'language': language,
      'tags': tags,
      'isProcessing': isProcessing,
      'processingProgress': processingProgress,
    };
  }

  factory Recording.fromJson(Map<String, dynamic> json) {
    return Recording(
      id: json['id'] as String,
      title: json['title'] as String,
      audioUri: json['audioUri'] as String,
      duration: json['duration'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      transcript: json['transcript'] as String?,
      enhancedTranscript: json['enhancedTranscript'] as String?,
      style: EnhancementStyle.values.firstWhere(
        (e) => e.name == json['style'],
        orElse: () => EnhancementStyle.note,
      ),
      language: json['language'] as String? ?? 'en-US',
      tags: List<String>.from(json['tags'] as List? ?? []),
      isProcessing: json['isProcessing'] as bool? ?? false,
      processingProgress: json['processingProgress'] as int? ?? 0,
    );
  }
}
