/* ============================================================
   HUBSPOT REGISTER — Netlify Function
   Recibe datos del formulario de Catalysis y los persiste en
   HubSpot CRM v3 como Contact + Company + Association.
   ============================================================ */

const HS_BASE = 'https://api.hubapi.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  const HS_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!HS_TOKEN) {
    console.error('HUBSPOT_PRIVATE_APP_TOKEN no configurado en Netlify');
    return resp(500, { error: 'Configuración del servidor incompleta' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return resp(400, { error: 'JSON inválido' });
  }

  const {
    firstname,
    lastname = '',
    email,
    phone = '',
    company,
    industry = '',
    nivel_de_madurez = '',
    acepto_recibir_mensajes_de_whatsapp = false,
    acuerdodeprivacidad = false,
  } = body;

  if (!firstname || !email || !company) {
    return resp(400, { error: 'Faltan campos requeridos: nombre, email y empresa' });
  }
  if (!acuerdodeprivacidad) {
    return resp(400, { error: 'Debes aceptar el aviso de privacidad' });
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${HS_TOKEN}`,
  };

  const contactProperties = {
    firstname,
    lastname,
    email,
    phone,
    industry,
    acepto_recibir_mensajes_de_whatsapp: !!acepto_recibir_mensajes_de_whatsapp,
    acuerdodeprivacidad: true,
    unidaddenegocio: 'Catalysis',
    lifecyclestage: 'lead',
  };

  try {
    // 1. Crear o actualizar Contacto (upsert por email)
    const contactId = await upsertContact(headers, email, contactProperties);

    // 2. Crear Empresa
    const companyRes = await fetch(`${HS_BASE}/crm/v3/objects/companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          name: company,
          industry,
          nivel_de_madurez,
        },
      }),
    });

    let companyId = null;
    if (companyRes.ok) {
      const data = await companyRes.json();
      companyId = data.id;
    } else {
      const errText = await companyRes.text();
      console.error('Error creando empresa:', companyRes.status, errText);
      return resp(201, {
        success: true,
        contactId,
        warning: 'Contacto creado, empresa no se pudo crear',
      });
    }

    // 3. Asociar Contacto → Empresa (associationTypeId 1 = HUBSPOT_DEFINED contact_to_company)
    if (contactId && companyId) {
      const assocRes = await fetch(
        `${HS_BASE}/crm/v3/associations/contact/company/batch/create`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            inputs: [
              {
                from: { id: contactId },
                to: { id: companyId },
                type: 'contact_to_company',
              },
            ],
          }),
        }
      );

      if (!assocRes.ok) {
        const errText = await assocRes.text();
        console.error('Error asociando contacto-empresa:', assocRes.status, errText);
      }
    }

    return resp(201, { success: true, contactId, companyId });
  } catch (err) {
    console.error('[hubspot-register] Error:', err);
    return resp(500, { error: err.message || 'Error interno del servidor' });
  }
};

async function upsertContact(headers, email, properties) {
  const createRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    return data.id;
  }

  // Email duplicado: HubSpot devuelve 409. Buscar contacto existente y actualizar.
  if (createRes.status === 409) {
    const searchRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: 'email', operator: 'EQ', value: email }] },
        ],
        properties: ['email'],
        limit: 1,
      }),
    });
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const existingId = searchData.results[0].id;
      await fetch(`${HS_BASE}/crm/v3/objects/contacts/${existingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ properties }),
      });
      return existingId;
    }
  }

  const errText = await createRes.text();
  console.error('Error creando contacto:', createRes.status, errText);
  let detail = 'No se pudo crear el contacto en HubSpot';
  try {
    const parsed = JSON.parse(errText);
    if (parsed.message) detail = `HubSpot: ${parsed.message}`;
  } catch {}
  throw new Error(detail);
}

function resp(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
