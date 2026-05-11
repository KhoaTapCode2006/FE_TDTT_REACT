import React, { useState } from 'react';
import { collectionService } from '@/services/backend/collection.service';

/**
 * Component test đơn giản cho Collection Service
 * Dùng để test các API calls và hiển thị kết quả
 */
function CollectionTest() {
  const [createdCollectionId, setCreatedCollectionId] = useState(null);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Test hàm createCollection với dữ liệu mẫu
   */
  async function handleCreateCollection() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const newCollection = await collectionService.createCollection({
        name: 'Test Collection ' + Date.now(),
        description: 'This is a test collection created from UI',
        tags: ['test', 'demo', 'ui-test'],
        visibility: 'public',
        thumbnail_url: 'https://via.placeholder.com/300x200'
      });

      setCreatedCollectionId(newCollection.id);
      setSuccessMessage(`✅ Collection created successfully! ID: ${newCollection.id}`);
      console.log('Created collection:', newCollection);
    } catch (err) {
      setError(`❌ Error: ${err.message} (Code: ${err.code})`);
      console.error('Create collection error:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Test hàm getCollection với ID vừa tạo
   */
  async function handleGetCollection() {
    if (!createdCollectionId) {
      setError('❌ Please create a collection first!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await collectionService.getCollection(createdCollectionId);
      setCollection(data);
      setSuccessMessage(`✅ Collection fetched successfully!`);
      console.log('Fetched collection:', data);
    } catch (err) {
      setError(`❌ Error: ${err.message} (Code: ${err.code})`);
      console.error('Get collection error:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Test hàm addPlacesToCollection
   */
  async function handleAddPlaces() {
    if (!createdCollectionId) {
      setError('❌ Please create a collection first!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await collectionService.addPlacesToCollection(
        createdCollectionId,
        ['place_001', 'place_002', 'place_003']
      );
      setCollection(updated);
      setSuccessMessage(`✅ Added 3 places successfully!`);
      console.log('Updated collection with places:', updated);
    } catch (err) {
      setError(`❌ Error: ${err.message} (Code: ${err.code})`);
      console.error('Add places error:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Reset tất cả state
   */
  function handleReset() {
    setCreatedCollectionId(null);
    setCollection(null);
    setError(null);
    setSuccessMessage(null);
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧪 Collection Service Test</h1>
      
      {/* Status Messages */}
      {loading && (
        <div style={styles.loading}>
          ⏳ Loading...
        </div>
      )}
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={styles.success}>
          {successMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.buttonGroup}>
        <button 
          onClick={handleCreateCollection} 
          disabled={loading}
          style={styles.button}
        >
          1️⃣ Create Collection
        </button>

        <button 
          onClick={handleGetCollection} 
          disabled={loading || !createdCollectionId}
          style={styles.button}
        >
          2️⃣ Get Collection
        </button>

        <button 
          onClick={handleAddPlaces} 
          disabled={loading || !createdCollectionId}
          style={styles.button}
        >
          3️⃣ Add Places
        </button>

        <button 
          onClick={handleReset}
          style={{ ...styles.button, ...styles.resetButton }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Collection ID Display */}
      {createdCollectionId && (
        <div style={styles.infoBox}>
          <strong>Collection ID:</strong> {createdCollectionId}
        </div>
      )}

      {/* Collection Data Display */}
      {collection && (
        <div style={styles.dataContainer}>
          <h2 style={styles.subtitle}>📦 Collection Data</h2>
          
          <div style={styles.dataSection}>
            <h3>Basic Info</h3>
            <p><strong>Name:</strong> {collection.name}</p>
            <p><strong>Description:</strong> {collection.description || 'N/A'}</p>
            <p><strong>Visibility:</strong> {collection.visibility}</p>
            <p><strong>Owner UID:</strong> {collection.owner_uid}</p>
            <p><strong>Saved Count:</strong> {collection.saved_count}</p>
            <p><strong>Created:</strong> {collection.created_at?.toLocaleString()}</p>
            <p><strong>Updated:</strong> {collection.updated_at?.toLocaleString()}</p>
          </div>

          <div style={styles.dataSection}>
            <h3>Tags ({collection.tags?.length || 0})</h3>
            {collection.tags && collection.tags.length > 0 ? (
              <div style={styles.tagContainer}>
                {collection.tags.map((tag, index) => (
                  <span key={index} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p>No tags</p>
            )}
          </div>

          <div style={styles.dataSection}>
            <h3>Places ({collection.places?.length || 0})</h3>
            {collection.places && collection.places.length > 0 ? (
              <ul style={styles.list}>
                {collection.places.map((place, index) => (
                  <li key={index} style={styles.listItem}>
                    <strong>Place ID:</strong> {place.place_id}<br />
                    <small>Added by: {place.added_by}</small><br />
                    <small>Added at: {place.added_at?.toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No places added yet</p>
            )}
          </div>

          <div style={styles.dataSection}>
            <h3>Collaborators ({collection.collaborators?.length || 0})</h3>
            {collection.collaborators && collection.collaborators.length > 0 ? (
              <ul style={styles.list}>
                {collection.collaborators.map((collab, index) => (
                  <li key={index} style={styles.listItem}>
                    <strong>UID:</strong> {collab.uid}<br />
                    <small>Contributions: {collab.contributed_count}</small><br />
                    <small>Joined: {collab.joined_at?.toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No collaborators</p>
            )}
          </div>

          <div style={styles.dataSection}>
            <h3>Savers ({collection.savers?.length || 0})</h3>
            {collection.savers && collection.savers.length > 0 ? (
              <ul style={styles.list}>
                {collection.savers.map((saver, index) => (
                  <li key={index} style={styles.listItem}>
                    <strong>UID:</strong> {saver.uid}<br />
                    <small>Saved at: {saver.saved_at?.toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No savers yet</p>
            )}
          </div>

          {/* Raw JSON Display */}
          <details style={styles.details}>
            <summary style={styles.summary}>🔍 View Raw JSON</summary>
            <pre style={styles.json}>
              {JSON.stringify(collection, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3>📝 Instructions:</h3>
        <ol>
          <li>Click "Create Collection" to create a test collection</li>
          <li>Click "Get Collection" to fetch the created collection data</li>
          <li>Click "Add Places" to add sample places to the collection</li>
          <li>Check the console for detailed logs</li>
          <li>Use "Reset" to start over</li>
        </ol>
      </div>
    </div>
  );
}

// Simple inline styles
const styles = {
  container: {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  subtitle: {
    color: '#555',
    borderBottom: '2px solid #ddd',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    transition: 'background-color 0.3s',
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  loading: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '5px',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    marginBottom: '15px',
    color: '#721c24',
  },
  success: {
    padding: '15px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '5px',
    marginBottom: '15px',
    color: '#155724',
  },
  infoBox: {
    padding: '10px',
    backgroundColor: '#d1ecf1',
    border: '1px solid #bee5eb',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  dataContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  dataSection: {
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    marginBottom: '8px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
  },
  tagContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '5px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  details: {
    marginTop: '20px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    padding: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
  },
  json: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto',
    fontSize: '12px',
    border: '1px solid #dee2e6',
  },
  instructions: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#e7f3ff',
    borderRadius: '5px',
    border: '1px solid #b3d9ff',
  },
};

export default CollectionTest;
