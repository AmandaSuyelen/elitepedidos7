import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Declare supabase client variable
let supabase: ReturnType<typeof createClient>

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️ Supabase environment variables are missing or contain placeholder values')
  console.warn('⚠️ Some features requiring database access will not work')
  console.warn('⚠️ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  
  // Create a dummy client that will fail gracefully
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
} else {
  console.log('✅ Supabase environment variables loaded successfully')
  console.log('🔗 Connecting to:', supabaseUrl)
  
  // Create Supabase client with actual credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    // Add retry and timeout configuration
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
    }
  })
}

// Export the supabase client
export { supabase }



// Test connection on initialization
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Add timeout to connection test
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout')), 5000);
    });
    
    const testPromise = supabase.from('pdv_products').select('count', { count: 'exact', head: true });

    const { error } = await Promise.race([testPromise, timeoutPromise]);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      console.error('   Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint || 'No hint provided',
        code: error.code || 'No code provided'
      })
      console.info('ℹ️ The application will continue with limited functionality.')
    } else {
      console.log('✅ Supabase connection test successful')
    }
  } catch (error) {
    console.error('❌ Supabase connection test error:', error)
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      console.error('   This usually means:')
      console.error('   1. Your Supabase URL is incorrect')
      console.error('   2. Your network is blocking the connection')
      console.error('   3. Your Supabase project is not running')
      console.error('   4. Your internet connection is unstable')
    } else if (error instanceof Error && error.message === 'Connection test timeout') {
      console.error('   Connection test timed out - this may indicate one of these issues:')
      console.error('   1. Slow internet connection')
      console.error('   2. Supabase service is experiencing delays')
      console.error('   3. Network firewall is blocking the connection')
    }
    console.info('ℹ️ A aplicação continuará funcionando com funcionalidades limitadas.')
  }
}
/*
// Run connection test with delay to avoid blocking app initialization
window.setTimeout(() => {
  try {
    testConnection();
  } catch (error) {
    console.error('❌ Error running Supabase connection test:', error)
  }
}, 1000);
*/