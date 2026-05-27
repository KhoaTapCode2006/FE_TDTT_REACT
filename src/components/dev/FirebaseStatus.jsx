// Development-only component for Firebase status
function FirebaseStatus() {
  if (import.meta.env.PROD) {
    return null;
  }

  return null;
}

export default FirebaseStatus;
