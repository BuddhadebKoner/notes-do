# Database Models Documentation

This document describes the database models for the Notes-Do application.

## User Model (`models/user.js`)

The User model handles authentication, profile information, academic details, and user interactions.

### Key Features:
- **Authentication**: Supports both Clerk integration and traditional password-based auth
- **Profile Management**: Complete user profile with personal and academic information
- **Social Features**: Followers/following, uploaded notes tracking, wishlist, favorites
- **Security**: Password hashing, account locking, login attempt tracking
- **Drive Integration**: Google Drive API connection and storage management
- **Preferences**: Theme, notifications, privacy settings

### Important Fields:
- `clerkId`: For Clerk authentication integration
- `email`, `username`: Unique identifiers
- `profile`: Personal information (name, avatar, bio)
- `academic`: University, department, semester, degree information
- `activity`: User's notes, favorites, wishlist, social connections
- `driveIntegration`: Google Drive connection details

### Security Features:
- Automatic password hashing with bcrypt
- Account locking after failed login attempts
- Secure token handling for password reset
- Privacy controls for profile visibility

## Note Model (`models/notes.js`)

The Note model handles PDF note storage, academic classification, and social interactions.

### Key Features:
- **Academic Classification**: University, department, course, semester organization
- **Google Drive Integration**: File storage using Drive API
- **Social Features**: Likes, comments, ratings, bookmarks, views tracking
- **Content Management**: Categories, tags, difficulty levels, chapters
- **Search & Discovery**: Full-text search, SEO optimization, trending algorithm
- **Moderation**: Content review, reporting system, visibility controls
- **Analytics**: View/download tracking, usage statistics

### Important Fields:
- `title`, `description`: Basic note information
- `academic`: University/department/course classification
- `file`: Google Drive file details (ID, URL, metadata)
- `uploader`: Reference to User who uploaded the note
- `social`: Likes, views, downloads, bookmarks, ratings
- `comments`: Nested comment system with replies and likes
- `visibility`: Access control (public, university, department, etc.)
- `status`: Moderation status (pending, approved, rejected)

### Social Features:
- **Likes System**: Users can like/unlike notes
- **Comments**: Threaded comments with replies and likes
- **Ratings**: 5-star rating system with reviews
- **Bookmarks**: Users can bookmark notes for later
- **Views/Downloads**: Tracking engagement metrics

## Relationships

### User ↔ Note Relationships:
- User uploads multiple Notes (`uploader` field)
- Users can like multiple Notes (`social.likes`)
- Users can bookmark multiple Notes (`social.bookmarks`)
- Users can rate multiple Notes (`social.rating.ratings`)
- Users can comment on multiple Notes (`comments`)

### Indexing Strategy:
Both models include comprehensive indexing for:
- **Performance**: Frequently queried fields
- **Uniqueness**: Email, username, driveFileId
- **Search**: Full-text search on multiple fields
- **Academic Queries**: University/department combinations
- **Social Features**: Likes, views, ratings for trending

## Usage Examples

### Creating a User:
```javascript
const user = new User({
  email: 'student@university.edu',
  username: 'student123',
  password: 'securePassword',
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  },
  academic: {
    university: 'University Name',
    department: 'Computer Science',
    currentSemester: 5
  }
});
```

### Creating a Note:
```javascript
const note = new Note({
  title: 'Data Structures - Linked Lists',
  description: 'Comprehensive notes on linked list implementation',
  academic: {
    university: 'University Name',
    department: 'Computer Science',
    course: {
      code: 'CS101',
      name: 'Data Structures'
    },
    semester: 3,
    academicYear: '2024-25'
  },
  subject: {
    name: 'Data Structures',
    category: 'lecture-notes'
  },
  file: {
    driveFileId: 'google-drive-file-id',
    driveFileName: 'linked-lists.pdf',
    size: 2048576,
    downloadUrl: 'https://drive.google.com/...'
  },
  uploader: userObjectId
});
```

## Security Considerations

1. **Password Security**: Passwords are hashed using bcrypt with salt rounds of 12
2. **Account Protection**: Login attempt limiting and account locking
3. **Data Sanitization**: Custom middleware prevents NoSQL injection
4. **Access Control**: Visibility settings control who can access notes
5. **File Security**: Google Drive integration ensures secure file storage

## Performance Optimizations

1. **Strategic Indexing**: Compound indexes for common query patterns
2. **Selective Population**: Only populate required relationship data
3. **Text Search**: MongoDB text indexes for efficient searching
4. **Pagination**: Built-in support for paginated queries
5. **Caching**: Virtual fields calculated on-demand

## Scalability Features

1. **Flexible Academic Structure**: Supports any university/department structure
2. **Extensible Categories**: Easy to add new note categories
3. **Modular Design**: Models can be extended without breaking changes
4. **Reference-based Relationships**: Efficient storage and querying
5. **Analytics Ready**: Built-in tracking for insights and recommendations