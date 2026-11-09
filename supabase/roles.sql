-- Ejecutar una vez en Supabase > SQL Editor.
-- Reemplaza las políticas existentes de solicitudes por permisos basados en rol.

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'editor', 'admin')),
    display_name text CONSTRAINT profiles_display_name_length CHECK (
        display_name IS NULL
        OR length(btrim(display_name)) BETWEEN 1 AND 80
    ),
    avatar_path text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;

UPDATE public.profiles AS profile
SET display_name = LEFT(COALESCE(
    NULLIF(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
    NULLIF(split_part(auth_user.email, '@', 1), '')
), 80)
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND profile.display_name IS NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_display_name_length'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_display_name_length
        CHECK (
            display_name IS NULL
            OR length(btrim(display_name)) BETWEEN 1 AND 80
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_avatar_path_owner'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_avatar_path_owner
        CHECK (
            avatar_path IS NULL
            OR avatar_path IN (
                id::text || '/avatar.jpg',
                id::text || '/avatar.png',
                id::text || '/avatar.webp'
            )
        );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

DROP POLICY IF EXISTS profiles_read_access ON public.profiles;
CREATE POLICY profiles_read_access
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
DROP POLICY IF EXISTS profiles_update_access ON public.profiles;
CREATE POLICY profiles_update_access
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR public.current_user_role() = 'admin'
)
WITH CHECK (
    id = auth.uid()
    OR public.current_user_role() = 'admin'
);

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE UPDATE (display_name, avatar_path, role) ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_path) ON public.profiles TO authenticated;

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'avatars',
    'avatars',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_or_admin_read ON storage.objects;
CREATE POLICY avatars_owner_or_admin_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        name IN (
            auth.uid()::text || '/avatar.jpg',
            auth.uid()::text || '/avatar.png',
            auth.uid()::text || '/avatar.webp'
        )
        OR public.current_user_role() = 'admin'
    )
);

DROP POLICY IF EXISTS avatars_owner_insert ON storage.objects;
CREATE POLICY avatars_owner_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND name IN (
        auth.uid()::text || '/avatar.jpg',
        auth.uid()::text || '/avatar.png',
        auth.uid()::text || '/avatar.webp'
    )
);

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND name IN (
        auth.uid()::text || '/avatar.jpg',
        auth.uid()::text || '/avatar.png',
        auth.uid()::text || '/avatar.webp'
    )
)
WITH CHECK (
    bucket_id = 'avatars'
    AND name IN (
        auth.uid()::text || '/avatar.jpg',
        auth.uid()::text || '/avatar.png',
        auth.uid()::text || '/avatar.webp'
    )
);

DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_owner_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND name IN (
        auth.uid()::text || '/avatar.jpg',
        auth.uid()::text || '/avatar.png',
        auth.uid()::text || '/avatar.webp'
    )
);

CREATE TABLE IF NOT EXISTS public.contactos_negocio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo text NOT NULL CHECK (tipo IN ('proveedor', 'contratista')),
    nombre text NOT NULL CHECK (length(btrim(nombre)) BETWEEN 1 AND 120),
    empresa text CHECK (empresa IS NULL OR length(empresa) <= 160),
    telefono text CHECK (telefono IS NULL OR length(telefono) <= 50),
    email text CHECK (email IS NULL OR length(email) <= 254),
    direccion text CHECK (direccion IS NULL OR length(direccion) <= 300),
    servicios text CHECK (servicios IS NULL OR length(servicios) <= 500),
    notas text CHECK (notas IS NULL OR length(notas) <= 2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contactos_negocio_admin_access ON public.contactos_negocio;
CREATE POLICY contactos_negocio_admin_access
ON public.contactos_negocio
FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

REVOKE ALL ON public.contactos_negocio FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactos_negocio TO authenticated;

CREATE OR REPLACE FUNCTION public.actualizar_contacto_negocio_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contactos_negocio_updated_at ON public.contactos_negocio;
CREATE TRIGGER contactos_negocio_updated_at
BEFORE UPDATE ON public.contactos_negocio
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_contacto_negocio_timestamp();

CREATE OR REPLACE FUNCTION public.asignar_rol_usuario(
    p_usuario_id uuid,
    p_rol text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR COALESCE(public.current_user_role(), '') <> 'admin' THEN
        RAISE EXCEPTION 'Solo un administrador puede asignar roles'
            USING ERRCODE = '42501';
    END IF;

    IF p_rol IS NULL OR p_rol NOT IN ('user', 'editor', 'admin') THEN
        RAISE EXCEPTION 'El rol solicitado no es válido'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.profiles
    SET role = p_rol
    WHERE id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró el usuario'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.asignar_rol_usuario(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asignar_rol_usuario(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        'user',
        LEFT(COALESCE(
            NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
            NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
            NULLIF(split_part(NEW.email, '@', 1), '')
        ), 80)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.profiles (id, email, role)
SELECT id, COALESCE(email, ''), 'user'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

CREATE OR REPLACE FUNCTION public.actualizar_estado_solicitud(
    p_solicitud_id text,
    p_estado text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR COALESCE(public.current_user_role(), '') NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'No tienes permiso para cambiar solicitudes'
            USING ERRCODE = '42501';
    END IF;

    IF p_estado IS NULL OR length(btrim(p_estado)) = 0 OR length(btrim(p_estado)) > 100 THEN
        RAISE EXCEPTION 'El estado debe contener entre 1 y 100 caracteres'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.solicitudes
    SET estado = btrim(p_estado)
    WHERE id::text = p_solicitud_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la solicitud'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.actualizar_solicitud(
    p_solicitud_id text,
    p_nombre text,
    p_telefono text,
    p_direccion text,
    p_tipo_servicio text,
    p_fecha date,
    p_descripcion text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR COALESCE(public.current_user_role(), '') NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'No tienes permiso para editar solicitudes'
            USING ERRCODE = '42501';
    END IF;

    IF p_nombre IS NULL OR length(btrim(p_nombre)) = 0 OR length(btrim(p_nombre)) > 160
       OR p_telefono IS NULL OR length(btrim(p_telefono)) = 0 OR length(btrim(p_telefono)) > 50
       OR p_direccion IS NULL OR length(btrim(p_direccion)) = 0 OR length(btrim(p_direccion)) > 300
       OR p_fecha IS NULL
       OR p_tipo_servicio IS NULL
       OR p_tipo_servicio NOT IN ('Mantenimiento', 'Reparación', 'Instalación', 'Diagnóstico')
       OR length(COALESCE(p_descripcion, '')) > 2000 THEN
        RAISE EXCEPTION 'Los datos de la solicitud no son válidos'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.solicitudes
    SET nombre = btrim(p_nombre),
        telefono = btrim(p_telefono),
        direccion = btrim(p_direccion),
        tipo_servicio = p_tipo_servicio,
        fecha = p_fecha,
        descripcion = NULLIF(btrim(COALESCE(p_descripcion, '')), '')
    WHERE id::text = p_solicitud_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la solicitud'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.eliminar_solicitud_admin(
    p_solicitud_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR COALESCE(public.current_user_role(), '') <> 'admin' THEN
        RAISE EXCEPTION 'Solo un administrador puede eliminar solicitudes'
            USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.solicitudes
    WHERE id::text = p_solicitud_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la solicitud'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

ALTER TABLE public.solicitudes
ADD COLUMN IF NOT EXISTS cotizacion_mxn numeric(10, 2);
ALTER TABLE public.solicitudes
ADD COLUMN IF NOT EXISTS pago_estado text NOT NULL DEFAULT 'sin_cotizacion';
ALTER TABLE public.solicitudes
ADD COLUMN IF NOT EXISTS mercadopago_preference_id text;
ALTER TABLE public.solicitudes
ADD COLUMN IF NOT EXISTS mercadopago_payment_id text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'solicitudes_cotizacion_mxn_positive'
          AND conrelid = 'public.solicitudes'::regclass
    ) THEN
        ALTER TABLE public.solicitudes
        ADD CONSTRAINT solicitudes_cotizacion_mxn_positive
        CHECK (
            cotizacion_mxn IS NULL
            OR cotizacion_mxn BETWEEN 1 AND 1000000
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'solicitudes_pago_estado_valid'
          AND conrelid = 'public.solicitudes'::regclass
    ) THEN
        ALTER TABLE public.solicitudes
        ADD CONSTRAINT solicitudes_pago_estado_valid
        CHECK (pago_estado IN ('sin_cotizacion', 'pendiente', 'pagado'));
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.actualizar_cotizacion_solicitud(
    p_solicitud_id text,
    p_cotizacion_mxn numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR COALESCE(public.current_user_role(), '') NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'No tienes permiso para cotizar solicitudes'
            USING ERRCODE = '42501';
    END IF;

    IF p_cotizacion_mxn IS NULL
       OR p_cotizacion_mxn < 1
       OR p_cotizacion_mxn > 1000000
       OR p_cotizacion_mxn <> round(p_cotizacion_mxn, 2) THEN
        RAISE EXCEPTION 'La cotización debe estar entre $1 y $1,000,000 MXN'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.solicitudes
    SET cotizacion_mxn = p_cotizacion_mxn,
        pago_estado = 'pendiente',
        mercadopago_preference_id = NULL,
        mercadopago_payment_id = NULL
    WHERE id::text = p_solicitud_id
      AND pago_estado <> 'pagado'
      AND mercadopago_preference_id IS NULL;

    IF NOT FOUND THEN
        IF EXISTS (
            SELECT 1
            FROM public.solicitudes
            WHERE id::text = p_solicitud_id
              AND pago_estado = 'pagado'
        ) THEN
            RAISE EXCEPTION 'No se puede cambiar una cotización que ya fue pagada'
                USING ERRCODE = '22023';
        END IF;
        IF EXISTS (
            SELECT 1
            FROM public.solicitudes
            WHERE id::text = p_solicitud_id
              AND mercadopago_preference_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'No se puede cambiar una cotización con un checkout activo'
                USING ERRCODE = '22023';
        END IF;
        RAISE EXCEPTION 'No se encontró la solicitud'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_estado_solicitud(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.actualizar_solicitud(text, text, text, text, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.eliminar_solicitud_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.actualizar_cotizacion_solicitud(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_estado_solicitud(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_solicitud(text, text, text, text, text, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_solicitud_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_cotizacion_solicitud(text, numeric) TO authenticated;

-- Las políticas permisivas se combinan con OR; se reemplazan para evitar
-- que una política anterior permita acceder a solicitudes de otros usuarios.
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'solicitudes'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.solicitudes', policy_name);
    END LOOP;
END;
$$;

ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY solicitudes_read_access
ON public.solicitudes
FOR SELECT
TO authenticated
USING (
    usuario_id = auth.uid()
    OR public.current_user_role() IN ('admin', 'editor')
);

CREATE POLICY solicitudes_insert_customer
ON public.solicitudes
FOR INSERT
TO authenticated
WITH CHECK (
    usuario_id = auth.uid()
    AND public.current_user_role() = 'user'
);

REVOKE UPDATE, DELETE ON public.solicitudes FROM anon, authenticated;
GRANT SELECT, INSERT ON public.solicitudes TO authenticated;
