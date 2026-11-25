-- Insertar la plantilla de Nevada Annual List Reminder con Unsubscribe incluido
INSERT INTO email_templates (name, subject, content) VALUES 
(
  'Nevada Annual List Reminder', 
  'Action Required: Nevada Annual Renewal Filing Reminder',
  '<h2 style="color: #1a1a1a; text-align: center;">Nevada Annual Renewal Filing Reminder</h2>

<p>Your Nevada Annual List must be filed by the last day of your anniversary month. This filing is mandatory to keep your company active and in good standing with the state.</p>

<h3 style="color: #1a1a1a;">Why file immediately:</h3>
<ul>
    <li>Missing your anniversary deadline results in penalties and late fees.</li>
    <li>Your business entity could lose its active status.</li>
    <li>Reinstatement requires additional costs and paperwork.</li>
</ul>

<p>File now—it only takes minutes.</p>

<div style="text-align: center; margin: 30px 0;">
    <a href="https://renewals.nationalfilingcorporation.com/renewals?state=NV"
       style="background-color: #0066cc; color: #ffffff; padding: 14px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px;">
       File Your Nevada Annual Renewal Now
    </a>
</div>

<p>Our secure service ensures your filing is completed accurately and submitted on time. State filing fees apply at checkout.</p>

<p>If you already filed, you can ignore this notice. You may also choose to file directly with the Nevada Secretary of State if you prefer.</p>

<p><strong>Don''t risk your company''s good standing. File today before your deadline passes.</strong></p>

<hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0 20px 0;">

<div style="text-align: center; font-size: 12px; color: #999;">
    <p>To stop receiving these emails, you can <a href="{{unsubscribe_url}}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p>
</div>'
);
