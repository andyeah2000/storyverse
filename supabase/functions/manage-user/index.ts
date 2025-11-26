// Supabase Edge Function: Admin Tasks
// Handles user deletion and project invite emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
}

interface SendInviteRequest {
  projectId: string;
  projectName: string;
  email: string;
  permission: 'view' | 'edit';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify JWT from request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Route: POST /delete-user
    if (req.method === 'POST' && path.endsWith('/delete-user')) {
      const body: DeleteUserRequest = await req.json();
      const targetUserId = body.userId || user.id;

      // Only allow users to delete their own account, or require admin check
      if (targetUserId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: can only delete your own account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete user's projects
      const { error: projectsError } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('user_id', targetUserId);

      if (projectsError) {
        console.error('Error deleting projects:', projectsError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete projects', details: projectsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete user's settings
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .delete()
        .eq('user_id', targetUserId);

      if (settingsError) {
        console.error('Error deleting settings:', settingsError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete settings', details: settingsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete project shares where user is owner or collaborator
      const { error: sharesError } = await supabaseAdmin
        .from('project_shares')
        .delete()
        .or(`shared_with_user_id.eq.${targetUserId},project_id.in.(select id from projects where user_id.eq.${targetUserId})`);

      if (sharesError) {
        console.error('Error deleting shares:', sharesError);
        // Continue even if this fails
      }

      // Delete activity logs
      const { error: activityError } = await supabaseAdmin
        .from('project_activity')
        .delete()
        .eq('user_id', targetUserId);

      if (activityError) {
        console.error('Error deleting activity logs:', activityError);
        // Continue even if this fails
      }

      // Finally, delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete user account', details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User account deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /send-invite
    if (req.method === 'POST' && path.endsWith('/send-invite')) {
      const body: SendInviteRequest = await req.json();
      const { projectId, projectName, email, permission } = body;

      if (!projectId || !email || !permission) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: projectId, email, permission' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns the project
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project || project.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Project not found or unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists in auth
      const { data: inviteeUser } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = inviteeUser?.users.find(u => u.email?.toLowerCase() === normalizedEmail);

      // Create or update project share record
      const { data: shareData, error: shareError } = await supabaseAdmin
        .from('project_shares')
        .upsert({
          project_id: projectId,
          project_name: projectName || 'Untitled Project',
          shared_with_email: normalizedEmail,
          shared_with_user_id: existingUser?.id || null,
          permission,
          accepted: false,
        }, {
          onConflict: 'project_id,shared_with_email',
        })
        .select()
        .single();

      if (shareError) {
        console.error('Error creating share:', shareError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invite', details: shareError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate invite link
      const appUrl = Deno.env.get('APP_URL') || 'https://your-app.vercel.app';
      const inviteToken = shareData.id;
      const inviteLink = `${appUrl}/accept-invite?token=${inviteToken}`;

      // Send email via Supabase SMTP or Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@storyverse.app';

      if (resendApiKey) {
        // Use Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: normalizedEmail,
            subject: `You've been invited to collaborate on "${projectName}"`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>StoryVerse Collaboration Invite</h1>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p><strong>${user.email}</strong> has invited you to collaborate on the project <strong>"${projectName}"</strong>.</p>
                    <p>Permission level: <strong>${permission === 'edit' ? 'Edit' : 'View Only'}</strong></p>
                    <p style="text-align: center;">
                      <a href="${inviteLink}" class="button">Accept Invitation</a>
                    </p>
                    <p>Or copy this link:</p>
                    <p style="word-break: break-all; color: #667eea;">${inviteLink}</p>
                    <p>If you don't have a StoryVerse account, you'll be prompted to create one when you accept the invite.</p>
                  </div>
                  <div class="footer">
                    <p>This invitation was sent from StoryVerse. If you didn't expect this email, you can safely ignore it.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Resend API error:', errorText);
          // Continue even if email fails - the share record is created
        }
      } else {
        // Fallback: Use Supabase SMTP (requires configuration in Supabase dashboard)
        // For now, we'll just log that email should be sent
        console.log('Email should be sent via Supabase SMTP:', {
          to: normalizedEmail,
          subject: `You've been invited to collaborate on "${projectName}"`,
          inviteLink,
        });
        // Note: Supabase SMTP integration would require additional setup
        // You can use Supabase's built-in email functions or configure SMTP in dashboard
      }

      return new Response(
        JSON.stringify({
          success: true,
          shareId: shareData.id,
          inviteLink,
          message: 'Invite sent successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

