import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { IRequestUser } from '../interfaces/user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      // Verify token with Supabase
      const user = await this.supabaseService.verifyToken(token);

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Fetch user profile to get role and org info
      const adminClient = this.supabaseService.getAdminClient();
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single();

      // Attach user info to request
      const requestUser: IRequestUser = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'member',
        organization_id: profile?.organization_id || '',
        access_token: token,
      };

      request.user = requestUser;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
