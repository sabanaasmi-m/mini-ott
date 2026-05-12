from rest_framework.permissions import BasePermission

def get_user_role(user):
    if not hasattr(user, 'userprofile'):
        return None
    return user.userprofile.role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            get_user_role(request.user) == 'ADMIN'
        )


class IsAdminOrCreator(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            get_user_role(request.user) in ['ADMIN', 'CREATOR']
        )
