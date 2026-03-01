import os
from flask_mail import Message
from flask import render_template_string
from . import mail

def send_order_confirmation_email(user_email, user_name, order_id, order_items, total_price, subtotal, jersey_tax, shipping_tax, shipping_cost, coupon_code=None, discount=0.0, payment_method=None):
    """
    Send an order confirmation email to the customer
    """
    try:
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <style>
                body { 
                    font-family: 'Poppins', Arial, sans-serif; 
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .container { 
                    max-width: 650px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background: #f5f5f5; 
                }
                .header { 
                    background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%); 
                    color: white; 
                    padding: 40px 20px; 
                    border-radius: 12px 12px 0 0; 
                    text-align: center; 
                }
                .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
                .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; }
                .greeting { font-size: 16px; margin-bottom: 20px; line-height: 1.6; }
                .order-id-box { background: #f0f0ff; border-left: 4px solid #635bff; padding: 15px; margin: 25px 0; border-radius: 4px; }
                .order-id-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
                .order-id-value { font-size: 28px; font-weight: 700; color: #635bff; margin-top: 5px; }
                .section-title { font-size: 18px; font-weight: 700; margin: 30px 0 20px 0; color: #222; }
                .order-items { margin: 20px 0; background: #fafafa; border-radius: 8px; overflow: hidden; }
                .item { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; align-items: center; }
                .item:last-child { border-bottom: none; }
                .item-details { flex: 1; }
                .item-name { font-weight: 600; font-size: 15px; color: #222; }
                .item-qty { font-size: 13px; color: #888; margin-top: 4px; }
                .item-price { font-weight: 700; font-size: 15px; color: #222; text-align: right; min-width: 80px; }
                .breakdown { background: linear-gradient(135deg, #f5f5ff 0%, #fafafa 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e8e8ff; }
                .breakdown-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; }
                .breakdown-label { color: #666; font-weight: 500; }
                .breakdown-value { font-weight: 600; color: #222; }
                .total-row { border-top: 2px solid #635bff; padding-top: 15px !important; margin-top: 15px !important; font-size: 18px; font-weight: 700; color: #635bff; }
                .shipping-time { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #2e7d32; }
                .shipping-time-title { font-weight: 700; margin-bottom: 5px; }
                .button-container { text-align: center; margin: 35px 0; }
                .confirm-button { display: inline-block; background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%); color: white; padding: 18px 50px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(99,91,255,0.3); }
                .confirm-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,91,255,0.4); }
                .message { font-size: 14px; line-height: 1.6; color: #555; margin: 20px 0; }
                .footer { text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee; color: #999; font-size: 12px; line-height: 1.8; }
                .footer-sender { font-weight: 600; color: #666; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Commande confirmée !</h1>
                    <p>Votre commande a bien été reçue</p>
                </div>
                <div class="content">
                    <p class="greeting">Bonjour {{ user_name }},</p>
                    <p class="message">Merci pour votre commande ! Elle a été confirmée et est en cours de préparation.</p>
                    <div class="order-id-box">
                        <div class="order-id-label">Numéro de commande</div>
                        <div class="order-id-value">#{{ order_id }}</div>
                    </div>
                    {% if payment_method %}
                    <div style="margin-top:8px; font-size:14px; color:#444;">
                        <strong>Paiement réalisé par :</strong> {{ payment_method }}
                    </div>
                    {% endif %}
                    <h3 class="section-title">Votre commande</h3>
                    <div class="order-items">
                        {% for item in order_items %}
                        <div class="item">
                            <div class="item-details">
                                <div class="item-name">{{ item.name }}</div>
                                <div class="item-qty">Quantité : {{ item.quantity }}</div>
                            </div>
                            <div class="item-price">€{{ "%.2f"|format(item.total) }}</div>
                        </div>
                        {% endfor %}
                    </div>
                    <h3 class="section-title">Récapitulatif</h3>
                    <div class="breakdown">
                        <div class="breakdown-row">
                            <span class="breakdown-label">Sous-total :</span>
                            <span class="breakdown-value">€{{ "%.2f"|format(subtotal) }}</span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">Taxe maillot (15%) :</span>
                            <span class="breakdown-value">€{{ "%.2f"|format(jersey_tax) }}</span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">Frais de livraison :</span>
                            <span class="breakdown-value">€{{ "%.2f"|format(shipping_cost) }}</span>
                        </div>
                        <div class="breakdown-row">
                            <span class="breakdown-label">Taxe livraison (7%) :</span>
                            <span class="breakdown-value">€{{ "%.2f"|format(shipping_tax) }}</span>
                        </div>
                        {% if discount and discount > 0 %}
                        <div class="breakdown-row">
                            <span class="breakdown-label">Remise{% if coupon_code %} ({{ coupon_code }}){% endif %} :</span>
                            <span class="breakdown-value">-€{{ "%.2f"|format(discount) }}</span>
                        </div>
                        {% endif %}
                        <div class="breakdown-row total-row">
                            <span>Montant total :</span>
                            <span>€{{ "%.2f"|format(total_price) }}</span>
                        </div>
                    </div>
                    <div class="shipping-time">
                        <div class="shipping-time-title">Délai estimé</div>
                        <div>La commande vous sera livrée sous environ 4 jours ouvrés</div>
                    </div>
                    <div class="button-container">
                        <a href="http://localhost:3000/order-confirmation/{{ order_id }}" class="confirm-button">✓ Voir votre commande</a>
                    </div>
                    <p class="message">Si vous avez des questions concernant votre commande, souhaitez effectuer une modification, ou avez des préoccupations, n'hésitez pas à contacter notre service client. Nous sommes là pour vous aider !</p>
                    <div class="footer">
                        <div class="footer-sender">— Équipe GoatShop</div>
                        <p>Cet e-mail a été envoyé depuis <strong>noreply@goatshop.com</strong></p>
                        <p>Merci d'avoir choisi GoatShop pour vos maillots de football préférés !</p>
                        <p>&copy; 2025 GoatShop. Tous droits réservés.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        html_body = render_template_string(
            html_template,
            user_name=user_name,
            order_id=order_id,
            order_items=order_items,
            subtotal=subtotal,
            jersey_tax=jersey_tax,
            shipping_cost=shipping_cost,
            shipping_tax=shipping_tax,
            total_price=total_price,
            coupon_code=coupon_code,
            discount=discount
        )
        suppress = os.environ.get('MAIL_SUPPRESS_SEND', os.environ.get('MAIL_DEBUG', '0'))
        if str(suppress).lower() in ('1', 'true', 'yes'):
            try:
                print('--- Rendered Order Confirmation Email (start) ---', flush=True)
                print(html_body, flush=True)
                print('--- Rendered Order Confirmation Email (end) ---', flush=True)
            except Exception:
                pass
        msg = Message(
            subject=f'Confirmation de commande - Commande #{order_id}',
            recipients=[user_email],
            html=html_body
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
