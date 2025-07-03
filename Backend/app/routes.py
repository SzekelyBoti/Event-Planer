from flask import Blueprint, request, jsonify
from datetime import datetime

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/events', methods=['POST'])
def create_event():
    from app import db 
    from app.models import Event

    data = request.get_json()
    title = data.get('title')
    occurrence_str = data.get('occurrence')
    description = data.get('description')

    if not title or not occurrence_str:
        return jsonify({"error": "Title and occurrence are required"}), 400

    try:
        occurrence = datetime.fromisoformat(occurrence_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    event = Event(title=title, occurrence=occurrence, description=description, user_id=1)
    db.session.add(event)
    db.session.commit()

    return jsonify({
        "id": event.id,
        "title": event.title,
        "occurrence": event.occurrence.isoformat(),
        "description": event.description
    }), 201

@bp.route('/events', methods=['GET'])
def list_events():
    from app import db
    from app.models import Event

    events = Event.query.all()
    events_list = [{
        "id": e.id,
        "title": e.title,
        "occurrence": e.occurrence.isoformat(),
        "description": e.description
    } for e in events]

    return jsonify(events_list)
@bp.route('/events/<int:event_id>', methods=['PATCH'])
def update_event(event_id):
    from app import db
    from app.models import Event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404;
    else :
        data = request.get_json()
        description = data.get("description")
        event.description = description
        db.session.commit()
        return jsonify({
            "id": event.id,
            "description": event.description
        }), 200
@bp.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    from app import db
    from app.models import Event
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404;
    else :
        db.session.delete(event)
        db.session.commit()
        return '', 204
    
    