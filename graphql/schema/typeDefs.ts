import { gql } from '@apollo/client';

export const typeDefs = gql`
  # Common types and interfaces
  interface Node {
    id: ID!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Upload scalar for file handling
  scalar Upload

  # Date and DateTime scalars
  scalar Date
  scalar DateTime

  # ----- Chat System Schema -----
  type ChatMessage implements Node {
    id: ID!
    content: String!
    sender: User!
    thread: ChatThread!
    createdAt: DateTime!
    updatedAt: DateTime!
    reactions: [Reaction!]
    attachments: [FileAttachment!]
    mentions: [User!]
    isEdited: Boolean!
    readBy: [User!]
    type: MessageType!
  }

  enum MessageType {
    TEXT
    IMAGE
    FILE
    SYSTEM
  }

  type Reaction {
    id: ID!
    emoji: String!
    user: User!
    createdAt: DateTime!
  }

  type ChatThread implements Node {
    id: ID!
    title: String
    participants: [User!]!
    messages(first: Int, after: String, last: Int, before: String): MessageConnection!
    createdAt: DateTime!
    updatedAt: DateTime!
    isGroup: Boolean!
    owner: User
    unreadCount(userId: ID!): Int!
    lastMessage: ChatMessage
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MessageEdge {
    cursor: String!
    node: ChatMessage!
  }

  type UserPresence {
    userId: ID!
    status: PresenceStatus!
    lastSeen: DateTime
    deviceInfo: String
  }

  enum PresenceStatus {
    ONLINE
    AWAY
    OFFLINE
    DO_NOT_DISTURB
  }

  # ----- File System Schema -----
  type FileSystemEntry implements Node {
    id: ID!
    name: String!
    path: String!
    type: FileSystemEntryType!
    size: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    modifiedAt: DateTime
    owner: User!
    parent: FileSystemEntry
    children(first: Int, after: String): FileSystemEntryConnection
    permissions: [FilePermission!]!
    metadata: FileMetadata
    contentType: String
    versions: [FileVersion!]
  }

  enum FileSystemEntryType {
    FILE
    DIRECTORY
  }

  type FileSystemEntryConnection {
    edges: [FileSystemEntryEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type FileSystemEntryEdge {
    cursor: String!
    node: FileSystemEntry!
  }

  type FilePermission {
    id: ID!
    user: User
    role: String
    permission: PermissionLevel!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum PermissionLevel {
    READ
    WRITE
    ADMIN
  }

  type FileMetadata {
    contentType: String
    hash: String
    width: Int
    height: Int
    duration: Int
    exif: JSON
    preview: String
  }

  scalar JSON

  type FileVersion {
    id: ID!
    file: FileSystemEntry!
    version: Int!
    size: Int!
    createdAt: DateTime!
    createdBy: User!
    comment: String
  }

  type FileAttachment {
    id: ID!
    file: FileSystemEntry!
    message: ChatMessage!
    createdAt: DateTime!
  }

  # ----- Knowledge Base Schema -----
  type KnowledgeItem implements Node {
    id: ID!
    name: String!
    description: String
    content: String
    category: KnowledgeCategory!
    tags: [String!]
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: User!
    updatedBy: User
    files: [FileSystemEntry!]
    visibility: Visibility!
    relatedItems: [KnowledgeItem!]
    metadata: JSON
  }

  enum KnowledgeCategory {
    DOCUMENT
    CODE
    IMAGE
    PDF
    WEBPAGE
    OTHER
  }

  enum Visibility {
    PUBLIC
    PRIVATE
    SHARED
  }

  type KnowledgeConnection {
    edges: [KnowledgeEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type KnowledgeEdge {
    cursor: String!
    node: KnowledgeItem!
  }

  # ----- Search API Schema -----
  type SearchResult {
    id: ID!
    type: SearchResultType!
    title: String!
    description: String
    preview: String
    highlight: String
    createdAt: DateTime!
    updatedAt: DateTime!
    url: String
    score: Float!
    category: String
    source: SearchSource!
  }

  enum SearchResultType {
    FILE
    MESSAGE
    KNOWLEDGE
    SETTING
    USER
  }

  enum SearchSource {
    CHAT
    FILE_SYSTEM
    KNOWLEDGE_BASE
    SETTINGS
    USERS
  }

  type SearchResultConnection {
    edges: [SearchResultEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    facets: [SearchFacet!]
  }

  type SearchResultEdge {
    cursor: String!
    node: SearchResult!
  }

  type SearchFacet {
    name: String!
    values: [SearchFacetValue!]!
  }

  type SearchFacetValue {
    value: String!
    count: Int!
  }

  input SearchInput {
    query: String!
    filters: [SearchFilter!]
    facets: [String!]
    first: Int
    after: String
    sources: [SearchSource!]
  }

  input SearchFilter {
    field: String!
    value: String!
    operator: FilterOperator!
  }

  enum FilterOperator {
    EQUALS
    NOT_EQUALS
    CONTAINS
    GREATER_THAN
    LESS_THAN
    BETWEEN
  }

  # ----- Settings Schema -----
  type Settings implements Node {
    id: ID!
    user: User!
    theme: ThemePreference!
    notifications: NotificationSettings!
    language: String!
    fontSize: Int!
    modelPreferences: ModelPreferences!
    updatedAt: DateTime!
  }

  enum ThemePreference {
    LIGHT
    DARK
    SYSTEM
  }

  type NotificationSettings {
    enabled: Boolean!
    chatNotifications: Boolean!
    emailNotifications: Boolean!
    pushNotifications: Boolean!
    doNotDisturb: Boolean!
    quietHoursStart: String
    quietHoursEnd: String
  }

  type ModelPreferences {
    defaultTextModel: AIModel
    defaultVisionModel: AIModel
    customParameters: JSON
  }

  type AIModel implements Node {
    id: ID!
    name: String!
    description: String!
    type: ModelType!
    version: String!
    parameters: Int!
    capabilities: [String!]!
    limitations: [String!]!
    contextLength: Int!
    imageSize: String
    thumbnailUrl: String!
    detailsUrl: String
    isDefault: Boolean!
    isEnabled: Boolean!
  }

  enum ModelType {
    TEXT
    VISION
  }

  # ----- User Schema -----
  type User implements Node {
    id: ID!
    email: String!
    name: String
    avatar: String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
    status: PresenceStatus
    settings: Settings
    threads(first: Int, after: String): ChatThreadConnection
    files(first: Int, after: String): FileSystemEntryConnection
    knowledgeItems(first: Int, after: String): KnowledgeConnection
  }

  enum UserRole {
    ADMIN
    USER
    GUEST
  }

  type ChatThreadConnection {
    edges: [ChatThreadEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ChatThreadEdge {
    cursor: String!
    node: ChatThread!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  # ----- Query Types -----
  type Query {
    # Node interface query
    node(id: ID!): Node

    # User queries
    me: User
    user(id: ID!): User
    users(first: Int, after: String, filter: String): UserConnection

    # Chat queries
    thread(id: ID!): ChatThread
    threads(first: Int, after: String): ChatThreadConnection
    message(id: ID!): ChatMessage
    userPresence(userId: ID!): UserPresence

    # File system queries
    fileSystemEntry(id: ID!, path: String): FileSystemEntry
    fileSystemEntries(
      parentId: ID
      path: String
      type: FileSystemEntryType
      first: Int
      after: String
    ): FileSystemEntryConnection
    
    # Knowledge base queries
    knowledgeItem(id: ID!): KnowledgeItem
    knowledgeItems(
      category: KnowledgeCategory
      tags: [String!]
      first: Int
      after: String
    ): KnowledgeConnection

    # Search queries
    search(input: SearchInput!): SearchResultConnection
    
    # Settings queries
    settings: Settings
    aiModel(id: ID!): AIModel
    aiModels(type: ModelType): [AIModel!]!
  }

  # ----- Mutation Types -----
  type Mutation {
    # User mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, name: String): AuthPayload!
    updateProfile(name: String, avatar: Upload): User!
    
    # Chat mutations
    createThread(participants: [ID!]!, title: String, isGroup: Boolean): ChatThread!
    addParticipants(threadId: ID!, userIds: [ID!]!): ChatThread!
    removeParticipants(threadId: ID!, userIds: [ID!]!): ChatThread!
    sendMessage(threadId: ID!, content: String!, attachments: [Upload!]): ChatMessage!
    editMessage(id: ID!, content: String!): ChatMessage!
    deleteMessage(id: ID!): Boolean!
    markAsRead(threadId: ID!): Boolean!
    addReaction(messageId: ID!, emoji: String!): Reaction!
    removeReaction(messageId: ID!, reactionId: ID!): Boolean!
    setPresence(status: PresenceStatus!): UserPresence!
    
    # File system mutations
    createDirectory(parentId: ID, path: String!, name: String!): FileSystemEntry!
    uploadFile(
      parentId: ID
      path: String!
      file: Upload!
      overwrite: Boolean
    ): FileSystemEntry!
    updateFile(id: ID!, file: Upload!): FileSystemEntry!
    moveEntry(id: ID!, destinationPath: String!): FileSystemEntry!
    deleteEntry(id: ID!): Boolean!
    renameEntry(id: ID!, newName: String!): FileSystemEntry!
    updatePermissions(
      entryId: ID!, 
      userId: ID!, 
      permission: PermissionLevel!
    ): FilePermission!
    
    # Knowledge base mutations
    createKnowledgeItem(
      name: String!
      description: String
      content: String
      category: KnowledgeCategory!
      tags: [String!]
      files: [ID!]
      visibility: Visibility!
    ): KnowledgeItem!
    updateKnowledgeItem(
      id: ID!
      name: String
      description: String
      content: String
      category: KnowledgeCategory
      tags: [String!]
      files: [ID!]
      visibility: Visibility
    ): KnowledgeItem!
    deleteKnowledgeItem(id: ID!): Boolean!
    
    # Settings mutations
    updateSettings(
      theme: ThemePreference
      fontSize: Int
      language: String
      notifications: NotificationSettingsInput
    ): Settings!
    updateModelSettings(
      modelId: ID!
      isEnabled: Boolean
      isDefault: Boolean
      contextLength: Int
    ): AIModel!
  }
  
  # ----- Subscription Types -----
  type Subscription {
    # Chat subscriptions
    messageReceived(threadId: ID): ChatMessage!
    threadUpdated(threadId: ID): ChatThread!
    userPresenceChanged(userId: ID): UserPresence!
    
    # File system subscriptions
    fileSystemUpdated(path: String): FileSystemEntry!
    
    # Knowledge base subscriptions
    knowledgeItemUpdated(id: ID): KnowledgeItem!
  }
  
  # ----- Input Types -----
  input NotificationSettingsInput {
    enabled: Boolean
    chatNotifications: Boolean
    emailNotifications: Boolean
    pushNotifications: Boolean
    doNotDisturb: Boolean
    quietHoursStart: String
    quietHoursEnd: String
  }
  
  # ----- Auth Types -----
  type AuthPayload {
    token: String!
    user: User!
    expiresAt: DateTime!
  }
  
  # ----- WebRTC Signaling Types -----
  type SignalingMessage {
    id: ID!
    from: ID!
    to: ID!
    type: SignalingType!
    payload: String!
    createdAt: DateTime!
  }
  
  enum SignalingType {
    OFFER
    ANSWER
    ICE_CANDIDATE
    HANGUP
  }
  
  type RTCSession implements Node {
    id: ID!
    participants: [User!]!
    createdAt: DateTime!
    isActive: Boolean!
    metadata: JSON
  }
  
  extend type Mutation {
    # WebRTC signaling mutations
    sendSignal(to: ID!, type: SignalingType!, payload: String!): SignalingMessage!
    createRTCSession(participants: [ID!]!): RTCSession!
    endRTCSession(sessionId: ID!): Boolean!
  }
  
  extend type Subscription {
    # WebRTC signaling subscriptions
    signalReceived: SignalingMessage!
    rtcSessionUpdated(sessionId: ID): RTCSession!
  }
  
  # ----- Storage API Types -----
  type StorageStats {
    used: Int!
    total: Int!
    available: Int!
    usedPercentage: Float!
    byType: [StorageTypeStats!]!
  }
  
  type StorageTypeStats {
    type: String!
    size: Int!
    count: Int!
    percentage: Float!
  }
  
  type StorageQuota {
    userId: ID!
    maxStorage: Int!
    usedStorage: Int!
    updatedAt: DateTime!
  }
  
  type BackupJob implements Node {
    id: ID!
    userId: ID!
    status: BackupStatus!
    startedAt: DateTime!
    completedAt: DateTime
    size: Int
    destination: String!
    error: String
  }
  
  enum BackupStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    FAILED
  }
  
  extend type Query {
    # Storage queries
    storageStats: StorageStats!
    storageQuota: StorageQuota!
    backupJobs(first: Int, after: String): [BackupJob!]!
  }
  
  extend type Mutation {
    # Storage mutations
    createBackup(destination: String!): BackupJob!
    cleanupStorage(types: [String!]): Int!
    updateStorageQuota(userId: ID!, maxStorage: Int!): StorageQuota!
  }
`;