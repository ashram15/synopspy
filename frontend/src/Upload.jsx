import './App.css'

export default function Upload() {
    return (
        <section id="upload">
            <button className="uploadButton">Upload Files</button>
            <div className="past-uploads">
                <h3>Past Uploads</h3>
                <ul>
                    <li>Doc 1</li>
                </ul>
            </div>
        </section>
    );
}
